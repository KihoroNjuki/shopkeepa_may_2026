# products/serializers.py

from rest_framework import serializers
from .models import Category, Product, BranchStock


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ('id', 'name')
        read_only_fields = ('id',)


class BranchStockSerializer(serializers.ModelSerializer):
    branch_name  = serializers.CharField(source='branch.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model  = BranchStock
        fields = ('id','product', 'branch', 'branch_name', 'quantity', 'alert_threshold', 'is_low_stock', 'updated_at')
        read_only_fields = ('id', 'updated_at')


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_levels  = BranchStockSerializer(many=True, read_only=True)

    class Meta:
        model  = Product
        fields = (
            'id', 'name', 'barcode', 'category', 'category_name',
            'unit', 'buying_price', 'selling_price',
            'is_active', 'stock_levels', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class ProductSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing products."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = Product
        fields = (
            'id', 'name', 'barcode', 'category_name',
            'unit', 'buying_price', 'selling_price', 'is_active'
        )
        read_only_fields = ('id',)


class CreateProductSerializer(serializers.ModelSerializer):
    """Used when creating a product — accepts category name as string."""
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = Product
        fields = (
            'id','name', 'barcode', 'category_name',
            'unit', 'buying_price', 'selling_price',
        )
        read_only_fields = ('id',)

    def validate_barcode(self, value):
        if not value:
            return None
        business = self.context['business']
        qs = Product.objects.filter(business=business, barcode=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if value and qs.exists():
            raise serializers.ValidationError('A product with this barcode already exists.')
        return value

    def create(self, validated_data):
        business      = self.context['business']
        category_name = validated_data.pop('category_name', None)
        category      = None

        if category_name:
            category, _ = Category.objects.get_or_create(
                business=business,
                name=category_name.strip().title()
            )

        return Product.objects.create(
            business=business,
            category=category,
            **validated_data
        )