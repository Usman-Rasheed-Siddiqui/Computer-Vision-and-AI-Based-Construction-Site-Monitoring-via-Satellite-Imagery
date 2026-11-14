
import os
import torch

from .networks import define_G


class CDEvaluator:

    def __init__(self, args):

        self.n_class = args.n_class

        self.net_G = define_G(
            args=args,
            gpu_ids=args.gpu_ids
        )

        self.device = torch.device("cpu")

        self.checkpoint_dir = args.checkpoint_dir

        self.pred_dir = args.output_folder
        os.makedirs(self.pred_dir, exist_ok=True)

    def load_checkpoint(self, checkpoint_name="best_ckpt.pt"):

        checkpoint_path = os.path.join(
            self.checkpoint_dir,
            checkpoint_name
        )

        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(
                f"Checkpoint not found: {checkpoint_path}"
            )

        checkpoint = torch.load(
            checkpoint_path,
            map_location=self.device,
            weights_only=False
        )

        self.net_G.load_state_dict(
            checkpoint["model_G_state_dict"]
        )

        self.net_G.to(self.device)
        self.net_G.eval()

        return self.net_G

    def _visualize_pred(self):

        pred = torch.argmax(
            self.G_pred,
            dim=1,
            keepdim=True
        )

        return pred * 255

    def _forward_pass(self, batch):

        self.batch = batch

        img_in1 = batch["A"].to(self.device)
        img_in2 = batch["B"].to(self.device)

        self.shape_h = img_in1.shape[-2]
        self.shape_w = img_in1.shape[-1]

        self.G_pred = self.net_G(img_in1, img_in2)

        return self._visualize_pred()

    def eval(self):
        self.net_G.eval()
