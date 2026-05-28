from rest_framework import serializers
from django.db import transaction
from .models import Sale, SaleItem
from products.models import Product, BranchStock


class SaleItemInputSerializer(serializers.Serializer):
    product    = serializers.UUIDField()
    quantity   = serializers.DecimalField(max_digits=10, decimal_places=2)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value


class CreateSaleSerializer(serializers.Serializer):
    """Handles the full sale creation including all line items."""
    payment_method = serializers.ChoiceField(choices=Sale.PaymentMethod.choices)
    note           = serializers.CharField(required=False, allow_blank=True)
    items          = SaleItemInputSerializer(many=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('A sale must have at least one item.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        branch = self.context['branch']
        user   = self.context['request'].user
        items  = validated_data.pop('items')

        # create the sale header
        sale = Sale.objects.create(
            branch=branch,
            served_by=user,
            payment_method=validated_data.get('payment_method'),
            note=validated_data.get('note', ''),
        )

        total = 0

        for item_data in items:
            product = Product.objects.get(
                id=item_data['product'],
                business=branch.business
            )
            quantity   = item_data['quantity']
            unit_price = item_data.get('unit_price') or product.selling_price

            # create the line item
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
            )

            # deduct stock at this branch
            stock, _ = BranchStock.objects.get_or_create(
                product=product,
                branch=branch,
                defaults={'quantity': 0, 'alert_threshold': 10}
            )
            stock.quantity = max(0, stock.quantity - quantity)
            stock.save()

            total += quantity * unit_price

        # save total
        sale.total = total
        sale.save()

        return sale


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal     = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model  = SaleItem
        fields = ('id', 'product', 'product_name', 'quantity', 'unit_price', 'subtotal')
        read_only_fields = ('id',)


class SaleSerializer(serializers.ModelSerializer):
    items       = SaleItemSerializer(many=True, read_only=True)
    served_by   = serializers.EmailField(source='served_by.email', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model  = Sale
        fields = (
            'id', 'branch', 'branch_name', 'served_by',
            'payment_method', 'total', 'note', 'items', 'created_at'
        )
        read_only_fields = ('id', 'total', 'created_at')


class SaleSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing sales."""
    served_by   = serializers.EmailField(source='served_by.email', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    item_count  = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model  = Sale
        fields = (
            'id', 'branch_name', 'served_by',
            'payment_method', 'total', 'item_count', 'created_at'
        )
        read_only_fields = ('id', 'total', 'created_at')