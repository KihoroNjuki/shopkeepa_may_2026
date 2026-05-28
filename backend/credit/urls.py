from django.urls import path
from .views import (
    ContactListCreateView,
    ContactDetailView,
    CreateCreditSaleView,
    CreditSaleListView,
    RecordSalePaymentView,
    CreateCreditRestockView,
    CreditRestockListView,
    RecordRestockPaymentView,
)

urlpatterns = [
    # Contacts
    path('<uuid:business_id>/contacts/',
         ContactListCreateView.as_view(), name='contact-list-create'),
    path('<uuid:business_id>/contacts/<uuid:contact_id>/',
         ContactDetailView.as_view(), name='contact-detail'),

    # Credit sales
    path('<uuid:business_id>/sales/',
         CreateCreditSaleView.as_view(), name='credit-sale-create'),
    path('<uuid:business_id>/sales/list/',
         CreditSaleListView.as_view(), name='credit-sale-list'),
    path('<uuid:business_id>/sales/<uuid:credit_id>/pay/',
         RecordSalePaymentView.as_view(), name='credit-sale-pay'),

    # Credit restocks
    path('<uuid:business_id>/restocks/',
         CreateCreditRestockView.as_view(), name='credit-restock-create'),
    path('<uuid:business_id>/restocks/list/',
         CreditRestockListView.as_view(), name='credit-restock-list'),
    path('<uuid:business_id>/restocks/<uuid:credit_id>/pay/',
         RecordRestockPaymentView.as_view(), name='credit-restock-pay'),
]