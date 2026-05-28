from django.urls import path
from .views import (
    RecordSaleView,
    SaleListView,
    SaleDetailView,
)

urlpatterns = [
    path('<uuid:business_id>/branches/<uuid:branch_id>/',                RecordSaleView.as_view(),  name='record-sale'),
    path('<uuid:business_id>/branches/<uuid:branch_id>/list/',           SaleListView.as_view(),    name='sale-list'),
    path('<uuid:business_id>/branches/<uuid:branch_id>/<uuid:sale_id>/', SaleDetailView.as_view(),  name='sale-detail'),
]