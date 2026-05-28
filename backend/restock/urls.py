from django.urls import path
from .views import (SupplierDetailView,
                    SupplierListCreateView,
                    RecordRestockView,
                    RestockListView,
                    RestockDetailView
                    )

urlpatterns = [
    # Suppliers
    path('<uuid:business_id>/suppliers/',                                    SupplierListCreateView.as_view(), name='supplier-list-create'),
    path('<uuid:business_id>/suppliers/<uuid:pk>/',                          SupplierDetailView.as_view(),     name='supplier-detail'),

    # Restocks
    path('<uuid:business_id>/branches/<uuid:branch_id>/',                    RecordRestockView.as_view(),      name='record-restock'),
    path('<uuid:business_id>/branches/<uuid:branch_id>/list/',               RestockListView.as_view(),        name='restock-list'),
    path('<uuid:business_id>/branches/<uuid:branch_id>/<uuid:restock_id>/',  RestockDetailView.as_view(),      name='restock-detail'),
]