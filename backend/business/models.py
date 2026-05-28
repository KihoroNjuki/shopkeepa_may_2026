import uuid
from django.db import models
from django.conf import settings


class Business(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='businesses')
    name       = models.CharField(max_length=128)
    industry   = models.CharField(max_length=64, blank=True)  # e.g. retail, pharmacy, hardware
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = 'businesses'
        ordering  = ['-created_at']

    def __str__(self):
        return self.name


class Branch(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business   = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='branches')
    name       = models.CharField(max_length=128)
    location   = models.CharField(max_length=256, blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'branches'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} — {self.business.name}'


class BranchMember(models.Model):
    class Role(models.TextChoices):
        MANAGER = 'manager', 'Manager'
        CASHIER = 'cashier', 'Cashier'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch     = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='members')
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='branch_memberships')
    role       = models.CharField(max_length=16, choices=Role.choices)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='invites_sent')
    joined_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'branch_members'
        unique_together = ('branch', 'user')  # one role per user per branch

    def __str__(self):
        return f'{self.user.email} — {self.role} @ {self.branch.name}'
    

class RolePrivilege(models.Model):
    business = models.OneToOneField(Business, on_delete=models.CASCADE, related_name='role_privileges')

    # Manager privileges
    manager_record_sales    = models.BooleanField(default=True)
    manager_view_sales      = models.BooleanField(default=True)
    manager_void_sale       = models.BooleanField(default=True)
    manager_add_products    = models.BooleanField(default=True)
    manager_edit_products   = models.BooleanField(default=True)
    manager_delete_products = models.BooleanField(default=True)
    manager_record_restock  = models.BooleanField(default=True)
    manager_view_analytics  = models.BooleanField(default=True)
    manager_invite_members  = models.BooleanField(default=False)
    manager_manage_branches = models.BooleanField(default=False)

    # Cashier privileges
    cashier_record_sales    = models.BooleanField(default=True)
    cashier_view_sales      = models.BooleanField(default=True)
    cashier_void_sale       = models.BooleanField(default=False)
    cashier_add_products    = models.BooleanField(default=False)
    cashier_edit_products   = models.BooleanField(default=False)
    cashier_delete_products = models.BooleanField(default=False)
    cashier_record_restock  = models.BooleanField(default=False)
    cashier_view_analytics  = models.BooleanField(default=False)
    cashier_invite_members  = models.BooleanField(default=False)
    cashier_manage_branches = models.BooleanField(default=False)

    class Meta:
        db_table = 'role_privileges'

    def __str__(self):
        return f'Privileges for {self.business.name}'

    def get_privileges(self, role):
        """Returns a dict of privileges for a given role."""
        prefix = f'{role}_'
        return {
            field.replace(prefix, ''): getattr(self, field)
            for field in [f.name for f in self._meta.fields]
            if field.startswith(prefix)
        }
    
class MemberPrivilegeOverride(models.Model):
    member     = models.OneToOneField(BranchMember, on_delete=models.CASCADE, related_name='privilege_override')
    business   = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='member_overrides')

    record_sales    = models.BooleanField(null=True, blank=True)
    view_sales      = models.BooleanField(null=True, blank=True)
    void_sale       = models.BooleanField(null=True, blank=True)
    add_products    = models.BooleanField(null=True, blank=True)
    edit_products   = models.BooleanField(null=True, blank=True)
    delete_products = models.BooleanField(null=True, blank=True)
    record_restock  = models.BooleanField(null=True, blank=True)
    view_analytics  = models.BooleanField(null=True, blank=True)
    invite_members  = models.BooleanField(null=True, blank=True)
    manage_branches = models.BooleanField(null=True, blank=True)

    class Meta:
        db_table = 'member_privilege_overrides'

    def __str__(self):
        return f'Override for {self.member.user.email} @ {self.member.branch.name}'