import DashboardNav from '../components/DashboardNav';

export default function MemberRequest() {
  return (
    <section className="relative w-full min-h-screen bg-[#080A19]">
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNav />

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 md:px-[82px] py-16">
          <div className="text-center">
            <h1 className="text-white text-[40px] sm:text-[56px] font-normal leading-[1.1] mb-4">
              Members &amp; Requests
            </h1>
            <p className="text-white/60 text-[16px] sm:text-[18px] max-w-[480px] mx-auto">
              Manage team members and access requests here. Content coming soon.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
