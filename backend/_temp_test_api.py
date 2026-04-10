import sys, os, django
sys.path.append('C:/Users/Rolan Sotomayor/Desktop/THESIS_2026/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DocEvalKapiyu.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from api.views.analytics_views import faculty_gap_analysis
from api.models import User

user = User.objects.first()
factory = APIRequestFactory()
request = factory.get('/api/analytics/gap-analysis/?refresh=1')
force_authenticate(request, user=user)

response = faculty_gap_analysis(request)
print('STATUS_CODE:', response.status_code)
print('DATA:', response.data)
