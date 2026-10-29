from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import ConstructionSites


@api_view(['GET'])
@permission_classes([AllowAny])
def database_check(request):
    try:
        site_count = ConstructionSites.objects.count()

        return Response({
            'status': 'success',
            'message': 'Django is connected to the sites table.',
            'site_count': site_count,
        })

    except Exception:
        return Response(
            {
                'status': 'error',
                'message': 'Could not read the sites table.',
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )