from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from business.models import Branch
from .models import Sale
from .serializer import (
    CreateSaleSerializer,
    SaleSerializer,
    SaleSummarySerializer,
)


class RecordSaleView(APIView):
    """POST /api/sales/<business_id>/branches/<branch_id>/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, business_id, branch_id):
        branch = generics.get_object_or_404(
            Branch, id=branch_id, business__id=business_id
        )

        serializer = CreateSaleSerializer(
            data=request.data,
            context={'branch': branch, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()

        return Response(
            SaleSerializer(sale).data,
            status=status.HTTP_201_CREATED
        )


class SaleListView(generics.ListAPIView):
    """GET /api/sales/<business_id>/branches/<branch_id>/
       List all sales for a branch with optional date filtering.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = SaleSummarySerializer

    def get_queryset(self):
        qs = Sale.objects.filter(
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

        # filter by payment method
        payment = self.request.query_params.get('payment_method')
        if payment:
            qs = qs.filter(payment_method=payment)

        return qs


class SaleDetailView(generics.RetrieveAPIView):
    """GET /api/sales/<business_id>/branches/<branch_id>/<sale_id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = SaleSerializer

    def get_object(self):
        return generics.get_object_or_404(
            Sale,
            id=self.kwargs['sale_id'],
            branch__id=self.kwargs['branch_id'],
            branch__business__id=self.kwargs['business_id']
        )
    
