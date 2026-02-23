import React, { useEffect, useState, useReducer } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, Pencil, Trash } from "lucide-react";
import { api } from "@/api";

// Reducer for edit dialog state
const editDialogReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN_ADD':
      return {
        isOpen: true,
        user: null,
        isAdding: true,
        form: {
          full_name: "",
          email: "",
          password: "",
          mobile_number: "",
          mess_status: "paid",
          total_amount: 0
        }
      };
    case 'OPEN_EDIT':
      return {
        isOpen: true,
        user: action.user,
        isAdding: false,
        form: {
          full_name: action.user.full_name || "",
          email: action.user.email || "",
          password: "",
          mobile_number: action.user.mobile_number || "",
          mess_status: action.user.mess_status || "paid",
          total_amount: action.user.total_amount || 0
        }
      };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'UPDATE_FORM':
      return { ...state, form: { ...state.form, [action.field]: action.value } };
    default:
      return state;
  }
};

const UserManagement = () => {
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit dialog state using reducer
  const [editDialog, dispatchEditDialog] = useReducer(editDialogReducer, {
    isOpen: false,
    user: null,
    isAdding: false,
    form: {
      full_name: "",
      email: "",
      password: "",
      mobile_number: "",
      mess_status: "paid",
      total_amount: 0
    }
  });

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);

    try {
      const response = await api("/api/admin/users");

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (response.status !== 200) {
        throw new Error(response.error || "Failed to load users");
      }

      // Log EVERYTHING about the response
      console.log("📦 Full response:", response);
      console.log("📦 Type:", typeof response);
      console.log("📦 Keys:", Object.keys(response));
      console.log("📦 response.users:", response.users);
      console.log("📦 Is array?:", Array.isArray(response.users));

      // Check if users exist
      if (response && response.users && Array.isArray(response.users)) {
        console.log("✅ Setting users:", response.users.length, "users found");
        setUsers(response.users);
      } else {
        console.error("❌ Response structure:", response);
        throw new Error("No users array in response");
      }

    } catch (err) {
      console.error("❌ Full error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    dispatchEditDialog({ type: 'OPEN_ADD' });
  };

  const handleEdit = (user) => {
    dispatchEditDialog({ type: 'OPEN_EDIT', user });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (editDialog.isAdding) {
        // Generate secure random password
        const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).toUpperCase().slice(-12);

        // Add new user
        response = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: editDialog.form.email,
            password: randomPassword,
            fullName: editDialog.form.full_name,
            role: "student",
            mobileNumber: editDialog.form.mobile_number,
            totalAmount: editDialog.form.total_amount
          }),
        });

        // TODO: Send email with generated password to user
      } else {
        // Check if user ID is valid before updating
        if (!editDialog.user || !editDialog.user.id) {
          throw new Error("Invalid user selected for update");
        }

        // Update existing user
        response = await api(`/api/admin/users/${editDialog.user.id}`, {
          method: "PUT",
          body: JSON.stringify({
            email: editDialog.form.email,
            full_name: editDialog.form.full_name,
            mobile_number: editDialog.form.mobile_number,
            mess_status: editDialog.form.mess_status,
            total_amount: editDialog.form.total_amount
          }),
        });
      }

      // ✅ Backend returns { success: true } directly
      if (response.ok || response.success || response.token) {
        toast({
          title: "Success",
          description: editDialog.isAdding ? "User added successfully" : "User updated successfully",
        });
        dispatchEditDialog({ type: 'CLOSE' });
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(editDialog.isAdding ? "Failed to add user" : "Failed to update user");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: editDialog.isAdding ? "Failed to add user" : "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (user) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser || !deletingUser.id) {
      toast({
        title: "Error",
        description: "Invalid user selected for deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await api(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setDeletingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(data.message || "Failed to delete user");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading)
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading users…
        </div>
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-description">
            Manage student accounts & mess fee details.
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Add New Student
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search student by name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none shadow-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Users className="w-5 h-5" /> Student List
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">

              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Mobile</th>

                  {/* ➕ NEW COLUMN (Amount) */}
                  <th className="p-3 text-right">Amount</th>

                  <th className="p-3 text-center">Mess Fee Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id || index}
                    className="border-b bg-background hover:bg-muted/5 dark:bg-muted/10 dark:hover:bg-muted/20"
                  >
                    <td className="p-3 font-medium">
                      {user.full_name}
                    </td>

                    <td className="p-3">{user.email}</td>

                    <td className="p-3">{user.mobile_number || "—"}</td>

                    {/* 💰 Display Amount (no logic change) */}
                    <td className="p-3 text-right font-semibold">
                      ₹{Number(user.total_amount || 0).toFixed(0)}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.mess_status === "paid"
                            ? "bg-success/15 text-success dark:bg-success/20 dark:text-success"
                            : user.mess_status === "half_paid"
                            ? "bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning"
                            : "bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive"
                        }`}
                      >
                        {user.mess_status === "unpaid" ? "Not Paid" : user.mess_status || "—"}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)} aria-label={`Edit ${user.full_name}`}>
                          <Pencil className="w-4 h-4" /> Edit
                        </Button>

                        <Button size="sm" variant="destructive" onClick={() => handleDelete(user)} aria-label={`Delete ${user.full_name}`}>
                          <Trash className="w-4 h-4" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog.isOpen} onOpenChange={(open) => !open && dispatchEditDialog({ type: 'CLOSE' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editDialog.isAdding ? "Add New Student" : "Edit User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editDialog.form.full_name}
                onChange={(e) => dispatchEditDialog({ type: 'UPDATE_FORM', field: 'full_name', value: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editDialog.form.email}
                onChange={(e) => dispatchEditDialog({ type: 'UPDATE_FORM', field: 'email', value: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                value={editDialog.form.mobile_number}
                onChange={(e) => dispatchEditDialog({ type: 'UPDATE_FORM', field: 'mobile_number', value: e.target.value })}
                maxLength="20"
              />
            </div>
            <div>
              <Label htmlFor="mess_status">Mess Fee Status</Label>
              <select
                id="mess_status"
                value={editDialog.form.mess_status}
                onChange={(e) => dispatchEditDialog({ type: 'UPDATE_FORM', field: 'mess_status', value: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="paid">Paid</option>
                <option value="half_paid">Half Paid</option>
                <option value="unpaid">Not Paid</option>
              </select>
            </div>
            <div>
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input
                id="total_amount"
                type="number"
                value={editDialog.form.total_amount}
                onChange={(e) => dispatchEditDialog({ type: 'UPDATE_FORM', field: 'total_amount', value: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => dispatchEditDialog({ type: 'CLOSE' })}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete user "{deletingUser?.full_name}"? This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default UserManagement;
