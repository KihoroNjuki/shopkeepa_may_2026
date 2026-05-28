from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from business.models import Branch
from .models import Supplier, Restock
from .serializers import (
    SupplierSerializer,
    CreateRestockSerializer,
    RestockSerializer,
    RestockSummarySerializer,
)

class SupplierListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/restock/<business_id>/suppliers/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = SupplierSerializer

    def get_business(self):
        from business.models import Business
        return generics.get_object_or_404(
            Business, id=self.kwargs['business_id'], owner=self.request.user
        )

    def get_queryset(self):
        return Supplier.objects.filter(business=self.get_business())

    def perform_create(self, serializer):
        serializer.save(business=self.get_business())


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/restock/<business_id>/suppliers/<supplier_id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = SupplierSerializer

    def get_queryset(self):
        from business.models import Business
        business = generics.get_object_or_404(
            Business, id=self.kwargs['business_id'], owner=self.request.user
        )
        return Supplier.objects.filter(business=business)


# ── Restock Views ──────────────────────────────────────────────────────────────

class RecordRestockView(APIView):
    """POST /api/restock/<business_id>/branches/<branch_id>/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, business_id, branch_id):
        branch = generics.get_object_or_404(
            Branch, id=branch_id, business__id=business_id
        )

        serializer = CreateRestockSerializer(
            data=request.data,
            context={'branch': branch, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        restock = serializer.save()

        return Response(
            RestockSerializer(restock).data,
            status=status.HTTP_201_CREATED
        )


class RestockListView(generics.ListAPIView):
    """GET /api/restock/<business_id>/branches/<branch_id>/list/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = RestockSummarySerializer

    def get_queryset(self):
        qs = Restock.objects.filter(
            branch__id=self.kwargs['branch_id'],
            branch__business__id=self.kwargs['business_id']
        )

        # filter by date range
        date_from = self.request.query_params.get('from')
        date_to   = self.request.query_params.get('to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        # filter by supplier
        supplier = self.request.query_params.get('supplier')
        if supplier:
            qs = qs.filter(supplier__name__icontains=supplier)

        return qs


class RestockDetailView(generics.RetrieveAPIView):
    """GET /api/restock/<business_id>/branches/<branch_id>/<restock_id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = RestockSerializer

    def get_object(self):
        return generics.get_object_or_404(
            Restock,
            id=self.kwargs['restock_id'],
            branch__id=self.kwargs['branch_id'],
            branch__business__id=self.kwargs['business_id']
        )