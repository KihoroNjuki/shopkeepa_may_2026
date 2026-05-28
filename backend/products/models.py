import uuid
from django.db import models


class Category(models.Model):
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('business.Business', on_delete=models.CASCADE, related_name='categories')
    name     = models.CharField(max_length=64)

    class Meta:
        db_table        = 'categories'
        unique_together = ('business', 'name')
        ordering        = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    class Unit(models.TextChoices):
        PIECE  = 'piece',  'Piece'
        KG     = 'kg',     'Kilogram'
        LITRE  = 'litre',  'Litre'
        GRAM   = 'gram',   'Gram'
        METRE  = 'metre',  'Metre'
        PACK   = 'pack',   'Pack'
        BOX    = 'box',    'Box'
        DOZEN  = 'dozen',  'Dozen'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business      = models.ForeignKey('business.Business', on_delete=models.CASCADE, related_name='products')
    category      = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name          = models.CharField(max_length=128)
    barcode       = models.CharField(max_length=64, blank=True, db_index=True, null = True, default=None)
    unit          = models.CharField(max_length=16, choices=Unit.choices, default=Unit.PIECE)
    buying_price  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'products'
        unique_together = ('business', 'barcode')
        ordering        = ['name']

    def __str__(self):
        return self.name


class BranchStock(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product         = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_levels')
    branch          = models.ForeignKey('business.Branch', on_delete=models.CASCADE, related_name='stock')
    quantity        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    alert_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'branch_stock'
        unique_together = ('product', 'branch')

    def __str__(self):
        return f'{self.product.name} @ {self.branch.name}'

    @property
    def is_low_stock(self):
        return self.quantity <= self.alert_threshold
