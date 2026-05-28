# products/views.py

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from business.models import Business, Branch, BranchMember
from business.permissions import IsBusinessOwner, IsOwnerOrManager, IsBranchMember
from .models import Category, Product, BranchStock
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductSummarySerializer,
    CreateProductSerializer,
    BranchStockSerializer,
)
from .barcode import lookup_barcode


# ── Barcode Lookup ─────────────────────────────────────────────────────────────

class BarcodeLookupView(APIView):
    """GET /api/products/barcode-lookup/?barcode=<barcode>"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barcode = request.query_params.get('barcode')
        if not barcode:
            return Response(
                {'detail': 'Barcode is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        result = lookup_barcode(barcode)
        if result:
            return Response({'found': True, 'product': result})
        return Response({
            'found':   False,
            'barcode': barcode,
            'detail':  'Product not found. Please enter details manually.',
        })


# ── Categories ─────────────────────────────────────────────────────────────────

class CategoryListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/products/<business_id>/categories/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = CategorySerializer

    def get_business(self):
        return generics.get_object_or_404(
            Business, id=self.kwargs['business_id'], owner=self.request.user
        )

    def get_queryset(self):
        return Category.objects.filter(business=self.get_business())

    def perform_create(self, serializer):
        serializer.save(business=self.get_business())


# ── Products ───────────────────────────────────────────────────────────────────

class ProductListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/products/<business_id>/"""
    permission_classes = [IsAuthenticated]

    def get_business(self):
        return generics.get_object_or_404(
            Business, id=self.kwargs['business_id']
        )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateProductSerializer
        return ProductSummarySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['business'] = self.get_business()
        return context

    def get_queryset(self):
        business = self.get_business()
        queryset = Product.objects.filter(business=business)

        # filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__name__icontains=category)

        # search by name or barcode
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(barcode__icontains=search)

        return queryset


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/products/<business_id>/<product_id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(business__id=self.kwargs['business_id'])

    def get_object(self):
        return generics.get_object_or_404(
            Product,
            id=self.kwargs['product_id'],
            business__id=self.kwargs['business_id']
        )


# ── Branch Stock ───────────────────────────────────────────────────────────────

class BranchStockView(generics.ListAPIView):
    """GET /api/products/<business_id>/branches/<branch_id>/stock/
       Lists all stock for a branch, flags low stock items.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = BranchStockSerializer

    def get_queryset(self):
        return BranchStock.objects.filter(
            branch__id=self.kwargs['branch_id'],
            branch__business__id=self.kwargs['business_id']
        ).select_related('product', 'branch')


class UpdateStockView(APIView):
    """PATCH /api/products/<business_id>/branches/<branch_id>/stock/<product_id>/
       Set quantity and alert threshold for a product at a branch.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, business_id, branch_id, product_id):
        branch  = generics.get_object_or_404(Branch, id=branch_id, business__id=business_id)
        product = generics.get_object_or_404(Product, id=product_id, business__id=business_id)

        stock, _ = BranchStock.objects.get_or_create(product=product, branch=branch)
        serializer = BranchStockSerializer(stock, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class LowStockView(generics.ListAPIView):
    """GET /api/products/<business_id>/branches/<branch_id>/low-stock/
       Returns only items below their alert threshold.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = BranchStockSerializer

    def get_queryset(self):
        from django.db.models import F
        return BranchStock.objects.filter(
            branch__id=self.kwargs['branch_id'],
            branch__business__id=self.kwargs['business_id'],
            quantity__lte=F('alert_threshold')
        ).select_related('product', 'branch')