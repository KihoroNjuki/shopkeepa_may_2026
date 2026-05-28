
from django.urls import path
from .views import (
    BarcodeLookupView,
    CategoryListCreateView,
    ProductListCreateView,
    ProductDetailView,
    BranchStockView,
    UpdateStockView,
    LowStockView,
)

urlpatterns = [
    # Barcode lookup
    path('barcode-lookup/', BarcodeLookupView.as_view(), name='barcode-lookup'),

    # Categories
    path('<uuid:business_id>/categories/', CategoryListCreateView.as_view(), name='category-list-create'),

    # Products
    path('<uuid:business_id>/',                        ProductListCreateView.as_view(), name='product-list-create'),
    path('<uuid:business_id>/<uuid:product_id>/',      ProductDetailView.as_view(),     name='product-detail'),

    # Stock
    path('<uuid:business_id>/branches/<uuid:branch_id>/stock/',                          BranchStockView.as_view(),   name='branch-stock'),
    path('<uuid:business_id>/branches/<uuid:branch_id>/stock/<uuid:product_id>/',        UpdateStockView.as_view(),   name='update-stock'),
    path('<uuid:business_id>/branches/<uuid:branch_id>/low-stock/',                      LowStockView.as_view(),      name='low-stock'),
]