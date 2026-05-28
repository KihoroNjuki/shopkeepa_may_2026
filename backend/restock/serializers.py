from rest_framework import serializers
from django.db import transaction
from .models import Supplier, Restock, RestockItem
from products.models import Product, BranchStock


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = ('id', 'name', 'phone', 'email', 'note')
        read_only_fields = ('id',)


class RestockItemInputSerializer(serializers.Serializer):
    """Used when creating a restock — accepts product id, quantity and buying price."""
    product      = serializers.UUIDField()
    quantity     = serializers.DecimalField(max_digits=10, decimal_places=2)
    buying_price = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value

    def validate_buying_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Buying price cannot be negative.')
        return value


class CreateRestockSerializer(serializers.Serializer):
    """Handles the full restock creation including all line items."""
    supplier = serializers.UUIDField(required=False, allow_null=True)
    note     = serializers.CharField(required=False, allow_blank=True)
    items    = RestockItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('A restock must have at least one item.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        branch = self.context['branch']
        user   = self.context['request'].user
        items  = validated_data.pop('items')

        # resolve supplier if provided
        supplier = None
        supplier_id = validated_data.pop('supplier', None)
        if supplier_id:
            supplier = Supplier.objects.filter(
                id=supplier_id,
                business=branch.business
            ).first()

        # create restock header
        restock = Restock.objects.create(
            branch=branch,
            restocked_by=user,
            supplier=supplier,
            note=validated_data.get('note', ''),
        )

        total_cost = 0

        for item_data in items:
            product = Product.objects.get(
                id=item_data['product'],
                business=branch.business
            )
            quantity     = item_data['quantity']
            buying_price = item_data['buying_price']

            # create line item
            RestockItem.objects.create(
                restock=restock,
                product=product,
                quantity=quantity,
                buying_price=buying_price,
            )

            # increase stock at this branch
            stock, _ = BranchStock.objects.get_or_create(
                product=product,
                branch=branch,
                defaults={'quantity': 0, 'alert_threshold': 10}
            )
            stock.quantity += quantity
            stock.save()

            total_cost += quantity * buying_price

        # save total cost
        restock.total_cost = total_cost
        restock.save()

        return restock


class RestockItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal     = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model  = RestockItem
        fields = ('id', 'product', 'product_name', 'quantity', 'buying_price', 'subtotal')
        read_only_fields = ('id',)


class RestockSerializer(serializers.ModelSerializer):
    items        = RestockItemSerializer(many=True, read_only=True)
    restocked_by = serializers.EmailField(source='restocked_by.email', read_only=True)
    branch_name  = serializers.CharField(source='branch.name', read_only=True)
    supplier     = SupplierSerializer(read_only=True)

    class Meta:
        model  = Restock
        fields = (
            'id', 'branch', 'branch_name', 'restocked_by',
            'supplier', 'total_cost', 'note', 'items', 'created_at'
        )
        read_only_fields = ('id', 'total_cost', 'created_at')


class RestockSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing restocks."""
    restocked_by  = serializers.EmailField(source='restocked_by.email', read_only=True)
    branch_name   = serializers.CharField(source='branch.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    item_count    = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model  = Restock
        fields = (
            'id', 'branch_name', 'restocked_by', 'supplier_name',
            'total_cost', 'item_count', 'created_at'
        )
        read_only_fields = ('id', 'total_cost', 'created_at')