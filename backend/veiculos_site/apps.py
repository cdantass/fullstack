from django.apps import AppConfig

class VeiculosSiteConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'veiculos_site'

    def ready(self):
        from django.contrib.auth.models import User
        User._meta.get_field('email').blank = False
        User._meta.get_field('email')._unique = True
