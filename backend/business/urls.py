from django.urls import path
from .analytics_views import BusinessAnalyticsView, BranchAnalyticsView
from .views import (
    BusinessListCreateView,
    BusinessDetailView,
    BranchListCreateView,
    BranchDetailView,
    InviteMemberView,
    RemoveMemberView,
    MyBranchesView,
    RolePrivilegeView,
    MyPrivilegesView,
    MemberPrivilegeOverrideView,
)

urlpatterns = [
    # Business
    path('',                     BusinessListCreateView.as_view(), name='business-list-create'),
    path('<uuid:pk>/',  BusinessDetailView.as_view(),     name='business-detail'),

    # Branches
    path('<uuid:business_id>/branches/',                                        BranchListCreateView.as_view(), name='branch-list-create'),
    path('<uuid:business_id>/branches/<uuid:id>/',                              BranchDetailView.as_view(),     name='branch-detail'),

    # Members
    path('<uuid:business_id>/branches/<uuid:branch_id>/invite/',                InviteMemberView.as_view(),     name='branch-invite'),
    path('<uuid:business_id>/branches/<uuid:branch_id>/members/<uuid:member_id>/', RemoveMemberView.as_view(), name='branch-remove-member'),

    # My branches
    path('my-branches/',         MyBranchesView.as_view(),         name='my-branches'),
    path('<uuid:business_id>/analytics/', BusinessAnalyticsView.as_view(), name='business-analytics'),
    path('<uuid:business_id>/analytics/branches/<uuid:branch_id>/', BranchAnalyticsView.as_view(),   name='branch-analytics'),

    # Privileges
    path('<uuid:business_id>/privileges/', RolePrivilegeView.as_view(),  name='role-privileges'),
    path('<uuid:business_id>/my-privileges/', MyPrivilegesView.as_view(),   name='my-privileges'),
    path('<uuid:business_id>/branches/<uuid:branch_id>/members/<uuid:member_id>/privileges/',
         MemberPrivilegeOverrideView.as_view(), name='member-privilege-override'),
]