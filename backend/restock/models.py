import uuid
from django.db import models
from django.conf import settings


class Supplier(models.Model):
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('business.Business', on_delete=models.CASCADE, related_name='suppliers')
    name     = models.CharField(max_length=128)
    phone    = models.CharField(max_length=32, blank=True)
    email    = models.EmailField(blank=True)
    note     = models.TextField(blank=True)

    class Meta:
        db_table        = 'suppliers'
        unique_together = ('business', 'name')
        ordering        = ['name']

    def __str__(self):
        return self.name


class Restock(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch     = models.ForeignKey('business.Branch', on_delete=models.CASCADE, related_name='restocks')
    restocked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='restocks')
    supplier   = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='restocks')
    note       = models.TextField(blank=True)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'restocks'
        ordering = ['-created_at']

    def __str__(self):
        return f'Restock @ {self.branch.name} on {self.created_at.date()}'


class RestockItem(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restock      = models.ForeignKey(Restock, on_delete=models.CASCADE, related_name='items')
    product      = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='restock_items')
    quantity     = models.DecimalField(max_digits=10, decimal_places=2)
    buying_price = models.DecimalField(max_digits=10, decimal_places=2)  # price at time of restock

    class Meta:
        db_table = 'restock_items'

    def __str__(self):
        return f'{self.quantity} x {self.product.name}'

    @property
    def subtotal(self):
        return self.quantity * self.buying_price