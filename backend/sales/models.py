# sales/models.py

import uuid
from django.db import models
from django.conf import settings


class Sale(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH  = 'cash',  'Cash'
        MPESA = 'mpesa', 'M-Pesa'
        CARD  = 'card',  'Card'
        CREDIT = 'credit', 'Credit'

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch         = models.ForeignKey('business.Branch', on_delete=models.CASCADE, related_name='sales')
    served_by      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sales')
    payment_method = models.CharField(max_length=16, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    total          = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    note           = models.TextField(blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sales'
        ordering = ['-created_at']

    def __str__(self):
        return f'Sale {self.id} @ {self.branch.name}'

    def compute_total(self):
        self.total = sum(item.subtotal for item in self.items.all())
        self.save()


class SaleItem(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale       = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product    = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='sale_items')
    quantity   = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # price at time of sale

    class Meta:
        db_table = 'sale_items'

    def __str__(self):
        return f'{self.quantity} x {self.product.name}'

    @property
    def subtotal(self):
        return self.quantity * self.unit_price