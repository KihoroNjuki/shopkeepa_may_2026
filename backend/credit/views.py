from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction

from business.models import Business
from sales.models import Sale
from restock.models import Restock
from .models import Contact, CreditSale, CreditRestock, Payment
from .serializers import (
    ContactSerializer,
    ContactSummarySerializer,
    CreditSaleSerializer,
    CreditRestockSerializer,
    RecordPaymentSerializer,
    PaymentSerializer,
)


# ── Contacts ──────────────────────────────────────────────────────────────────

class ContactListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/credit/<business_id>/contacts/"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return ContactSummarySerializer if self.request.method == 'GET' else ContactSerializer

    def get_business(self):
        return generics.get_object_or_404(Business, id=self.kwargs['business_id'])

    def get_queryset(self):
        qs = Contact.objects.filter(business=self.get_business())
        contact_type = self.request.query_params.get('type')
        if contact_type:
            qs = qs.filter(contact_type__in=[contact_type, 'both'])
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(business=self.get_business())


class ContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/credit/<business_id>/contacts/<contact_id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = ContactSerializer

    def get_queryset(self):
        return Contact.objects.filter(business__id=self.kwargs['business_id'])

    def get_object(self):
        return generics.get_object_or_404(
            Contact,
            id=self.kwargs['contact_id'],
            business__id=self.kwargs['business_id']
        )


# ── Credit Sales ──────────────────────────────────────────────────────────────

class CreateCreditSaleView(APIView):
    """POST /api/credit/<business_id>/sales/
       Attaches credit info to an existing sale.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        sale_id     = request.data.get('sale_id')
        contact_id  = request.data.get('contact_id')
        amount_paid = request.data.get('amount_paid', 0)
        due_date    = request.data.get('due_date')

        sale    = generics.get_object_or_404(Sale, id=sale_id,
                                              branch__business__id=business_id)
        contact = generics.get_object_or_404(Contact, id=contact_id,
                                              business__id=business_id)

        if hasattr(sale, 'credit'):
            return Response({'detail': 'This sale already has credit attached.'},
                            status=status.HTTP_400_BAD_REQUEST)

        amount_paid  = float(amount_paid or 0)
        total_amount = float(sale.total)
        balance_due  = total_amount - amount_paid

        credit = CreditSale.objects.create(
            sale=sale,
            contact=contact,
            total_amount=total_amount,
            amount_paid=amount_paid,
            balance_due=balance_due,
            due_date=due_date,
        )
        credit.update_status()

        # record initial payment if any
        if amount_paid > 0:
            Payment.objects.create(
                credit_sale=credit,
                amount=amount_paid,
                payment_method=request.data.get('payment_method', 'cash'),
                recorded_by=request.user,
                note='Initial deposit',
            )

        # update sale payment method to credit
        sale.payment_method = 'credit'
        sale.save()

        return Response(CreditSaleSerializer(credit).data,
                        status=status.HTTP_201_CREATED)


class CreditSaleListView(generics.ListAPIView):
    """GET /api/credit/<business_id>/sales/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = CreditSaleSerializer

    def get_queryset(self):
        qs = CreditSale.objects.filter(
            sale__branch__business__id=self.kwargs['business_id']
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class RecordSalePaymentView(APIView):
    """POST /api/credit/<business_id>/sales/<credit_id>/pay/"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id, credit_id):
        credit = generics.get_object_or_404(
            CreditSale,
            id=credit_id,
            sale__branch__business__id=business_id
        )

        if credit.status == 'paid':
            return Response({'detail': 'This debt is already fully paid.'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = float(serializer.validated_data['amount'])
        if amount > float(credit.balance_due):
            return Response({'detail': f'Amount exceeds balance due of {credit.balance_due}.'},
                            status=status.HTTP_400_BAD_REQUEST)

        Payment.objects.create(
            credit_sale=credit,
            amount=amount,
            payment_method=serializer.validated_data['payment_method'],
            recorded_by=request.user,
            note=serializer.validated_data.get('note', ''),
        )

        credit.amount_paid  = float(credit.amount_paid) + amount
        credit.balance_due  = float(credit.balance_due) - amount
        credit.save()
        credit.update_status()

        return Response(CreditSaleSerializer(credit).data)


# ── Credit Restocks ───────────────────────────────────────────────────────────

class CreateCreditRestockView(APIView):
    """POST /api/credit/<business_id>/restocks/"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        restock_id  = request.data.get('restock_id')
        contact_id  = request.data.get('contact_id')
        amount_paid = request.data.get('amount_paid', 0)
        due_date    = request.data.get('due_date')

        restock = generics.get_object_or_404(Restock, id=restock_id,
                                              branch__business__id=business_id)
        contact = generics.get_object_or_404(Contact, id=contact_id,
                                              business__id=business_id)

        if hasattr(restock, 'credit'):
            return Response({'detail': 'This restock already has credit attached.'},
                            status=status.HTTP_400_BAD_REQUEST)

        amount_paid  = float(amount_paid or 0)
        total_amount = float(restock.total_cost)
        balance_due  = total_amount - amount_paid

        credit = CreditRestock.objects.create(
            restock=restock,
            contact=contact,
            total_amount=total_amount,
            amount_paid=amount_paid,
            balance_due=balance_due,
            due_date=due_date,
        )
        credit.update_status()

        if amount_paid > 0:
            Payment.objects.create(
                credit_restock=credit,
                amount=amount_paid,
                payment_method=request.data.get('payment_method', 'cash'),
                recorded_by=request.user,
                note='Initial deposit',
            )

        return Response(CreditRestockSerializer(credit).data,
                        status=status.HTTP_201_CREATED)


class CreditRestockListView(generics.ListAPIView):
    """GET /api/credit/<business_id>/restocks/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = CreditRestockSerializer

    def get_queryset(self):
        qs = CreditRestock.objects.filter(
            restock__branch__business__id=self.kwargs['business_id']
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class RecordRestockPaymentView(APIView):
    """POST /api/credit/<business_id>/restocks/<credit_id>/pay/"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id, credit_id):
        credit = generics.get_object_or_404(
            CreditRestock,
            id=credit_id,
            restock__branch__business__id=business_id
        )

        if credit.status == 'paid':
            return Response({'detail': 'This debt is already fully paid.'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = float(serializer.validated_data['amount'])
        if amount > float(credit.balance_due):
            return Response({'detail': f'Amount exceeds balance due of {credit.balance_due}.'},
                            status=status.HTTP_400_BAD_REQUEST)

        Payment.objects.create(
            credit_restock=credit,
            amount=amount,
            payment_method=serializer.validated_data['payment_method'],
            recorded_by=request.user,
            note=serializer.validated_data.get('note', ''),
        )

        credit.amount_paid = float(credit.amount_paid) + amount
        credit.balance_due = float(credit.balance_due) - amount
        credit.save()
        credit.update_status()

        return Response(CreditRestockSerializer(credit).data)