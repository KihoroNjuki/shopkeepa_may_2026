from rest_framework import serializers
from .models import Contact, CreditSale, CreditRestock, Payment


class PaymentSerializer(serializers.ModelSerializer):
    recorded_by = serializers.EmailField(source='recorded_by.email', read_only=True)

    class Meta:
        model  = Payment
        fields = ('id', 'amount', 'payment_method', 'recorded_by', 'note', 'created_at')
        read_only_fields = ('id', 'created_at', 'recorded_by')


class RecordPaymentSerializer(serializers.Serializer):
    amount         = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=Payment.PaymentMethod.choices)
    note           = serializers.CharField(required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value


class CreditSaleSerializer(serializers.ModelSerializer):
    contact_name  = serializers.CharField(source='contact.name', read_only=True)
    contact_phone = serializers.CharField(source='contact.phone', read_only=True)
    payments      = PaymentSerializer(many=True, read_only=True)
    sale_total    = serializers.DecimalField(source='sale.total', max_digits=12,
                                              decimal_places=2, read_only=True)

    class Meta:
        model  = CreditSale
        fields = ('id', 'contact', 'contact_name', 'contact_phone', 'sale_total',
                  'total_amount', 'amount_paid', 'balance_due', 'status',
                  'due_date', 'payments', 'created_at')
        read_only_fields = ('id', 'total_amount', 'amount_paid',
                            'balance_due', 'status', 'created_at')


class CreditRestockSerializer(serializers.ModelSerializer):
    contact_name  = serializers.CharField(source='contact.name', read_only=True)
    contact_phone = serializers.CharField(source='contact.phone', read_only=True)
    payments      = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model  = CreditRestock
        fields = ('id', 'contact', 'contact_name', 'contact_phone',
                  'total_amount', 'amount_paid', 'balance_due', 'status',
                  'due_date', 'payments', 'created_at')
        read_only_fields = ('id', 'total_amount', 'amount_paid',
                            'balance_due', 'status', 'created_at')


class ContactSerializer(serializers.ModelSerializer):
    total_owed  = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_owing = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    credit_sales    = CreditSaleSerializer(many=True, read_only=True)
    credit_restocks = CreditRestockSerializer(many=True, read_only=True)

    class Meta:
        model  = Contact
        fields = ('id', 'name', 'phone', 'notes', 'contact_type',
                  'total_owed', 'total_owing', 'credit_sales',
                  'credit_restocks', 'created_at')
        read_only_fields = ('id', 'created_at')


class ContactSummarySerializer(serializers.ModelSerializer):
    total_owed  = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_owing = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model  = Contact
        fields = ('id', 'name', 'phone', 'notes', 'contact_type',
                  'total_owed', 'total_owing', 'created_at')
        read_only_fields = ('id', 'created_at')