import uuid
from django.db import models
from django.conf import settings


class Contact(models.Model):
    """A debtor or creditor — shared model for both."""

    class ContactType(models.TextChoices):
        DEBTOR   = 'debtor',   'Debtor'
        CREDITOR = 'creditor', 'Creditor'
        BOTH     = 'both',     'Both'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business   = models.ForeignKey('business.Business', on_delete=models.CASCADE, related_name='contacts')
    name       = models.CharField(max_length=128)
    phone      = models.CharField(max_length=32, blank=True)
    notes      = models.TextField(blank=True)
    contact_type = models.CharField(max_length=16, choices=ContactType.choices, default=ContactType.DEBTOR)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contacts'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def total_owed(self):
        """Total amount this contact owes the business."""
        from django.db.models import Sum
        total = self.credit_sales.filter(
            status__in=['pending', 'partial']
        ).aggregate(s=Sum('balance_due'))['s'] or 0
        return total

    @property
    def total_owing(self):
        """Total amount the business owes this contact."""
        from django.db.models import Sum
        total = self.credit_restocks.filter(
            status__in=['pending', 'partial']
        ).aggregate(s=Sum('balance_due'))['s'] or 0
        return total


class CreditSale(models.Model):
    """A sale made on credit — linked to a Sale."""

    class Status(models.TextChoices):
        PENDING  = 'pending',  'Pending'
        PARTIAL  = 'partial',  'Partial'
        PAID     = 'paid',     'Paid'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale        = models.OneToOneField('sales.Sale', on_delete=models.CASCADE, related_name='credit')
    contact     = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='credit_sales')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due  = models.DecimalField(max_digits=12, decimal_places=2)
    status      = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    due_date    = models.DateField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'credit_sales'
        ordering = ['-created_at']

    def __str__(self):
        return f'Credit sale — {self.contact.name} — {self.balance_due}'

    def update_status(self):
        if self.balance_due <= 0:
            self.status = self.Status.PAID
        elif self.amount_paid > 0:
            self.status = self.Status.PARTIAL
        else:
            self.status = self.Status.PENDING
        self.save()


class CreditRestock(models.Model):
    """A restock done on credit — linked to a Restock."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PARTIAL = 'partial', 'Partial'
        PAID    = 'paid',    'Paid'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restock      = models.OneToOneField('restock.Restock', on_delete=models.CASCADE, related_name='credit')
    contact      = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='credit_restocks')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due  = models.DecimalField(max_digits=12, decimal_places=2)
    status       = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    due_date     = models.DateField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'credit_restocks'
        ordering = ['-created_at']

    def update_status(self):
        if self.balance_due <= 0:
            self.status = self.Status.PAID
        elif self.amount_paid > 0:
            self.status = self.Status.PARTIAL
        else:
            self.status = self.Status.PENDING
        self.save()


class Payment(models.Model):
    """A repayment against a credit sale or restock."""

    class PaymentMethod(models.TextChoices):
        CASH  = 'cash',  'Cash'
        MPESA = 'mpesa', 'M-Pesa'
        CARD  = 'card',  'Card'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_sale   = models.ForeignKey(CreditSale, on_delete=models.CASCADE,
                                       related_name='payments', null=True, blank=True)
    credit_restock = models.ForeignKey(CreditRestock, on_delete=models.CASCADE,
                                        related_name='payments', null=True, blank=True)
    amount        = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=16, choices=PaymentMethod.choices,
                                       default=PaymentMethod.CASH)
    recorded_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                       null=True, related_name='payments_recorded')
    note          = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']