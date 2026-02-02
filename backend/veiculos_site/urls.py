from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import CombinarChamadosView

router = DefaultRouter()
router.register(r'veiculos', views.VeiculoViewSet, basename='veiculo')
router.register(r'motoristas', views.MotoristaViewSet, basename='motorista')
router.register(r'chamados', views.ChamadoViewSet, basename='chamado')
router.register(r'avaliacoes', views.AvaliacaoViewSet, basename='avaliacao')

urlpatterns = [
    # Custom endpoints must come BEFORE router to take precedence
    path("dashboard/stats/", views.DashboardStatsView.as_view(), name="dashboard-stats"),
    path("chamados/combinar/", CombinarChamadosView.as_view(), name="combinar-chamados"),
    path('', include(router.urls)),
    path('me/', views.UserProfileView.as_view(), name='user-profile'),
    path('municipios/', views.MunicipioListView.as_view(), name='municipio-list'),
    path('motoristas-disponiveis/', views.MotoristaDisponivelListView.as_view(), name='motorista-disponivel-list'),
    path('veiculos-disponiveis/', views.VeiculoDisponivelListView.as_view(), name='veiculo-disponivel-list'),
    path('meus-chamados/', views.MeusChamadosListView.as_view(), name='meus-chamados-list'),
]