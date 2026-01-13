import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, Pencil, Trash } from "lucide-react";

const UserManagement = () => {
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    mess_status: "paid",
    total_amount: 0
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
      const res = await fetch("http://localhost:3000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await res.json();
      console.log("Users API:", data);

      setUsers(data.users || []);
    } catch (err) {
      console.error("User fetch error:", err);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingUser(null);
    setEditForm({
      full_name: "",
      email: "",
      mobile_number: "",
      mess_status: "paid",
      total_amount: 0
    });
    setIsEditDialogOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsAddingNew(false);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      mobile_number: user.mobile_number || "",
      mess_status: user.mess_status || "paid",
      total_amount: user.total_amount || 0
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      let res;
      if (isAddingNew) {
        // Add new user
        res = await fetch("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            email: editForm.email,
            password: "defaultpassword", // You might want to generate a random password or ask for it
            fullName: editForm.full_name,
            role: "student",
            mobileNumber: editForm.mobile_number,
            totalAmount: editForm.total_amount
          }),
        });
      } else {
        // Update existing user
        res = await fetch(`http://localhost:3000/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(editForm),
        });
      }

      if (res.ok) {
        toast({
          title: "Success",
          description: isAddingNew ? "User added successfully" : "User updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        setIsAddingNew(false);
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(isAddingNew ? "Failed to add user" : "Failed to update user");
      }
    } catch (err) {
      console.error("Edit user error:", err);
      toast({
        title: "Error",
        description: isAddingNew ? "Failed to add user" : "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (user) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;

    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setDeletingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      toast({
        title: "Error",
        description: "Failed to delete user",
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
                {filteredUsers.map((user, index) => (
                  <tr
                    key={index}
                    className={`border-b ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/5 dark:bg-muted/10"
                    }`}
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
                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                          <Pencil className="w-4 h-4" /> Edit
                        </Button>

                        <Button size="sm" variant="destructive" onClick={() => handleDelete(user)}>
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddingNew ? "Add New Student" : "Edit User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                value={editForm.mobile_number}
                onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                maxLength="20"
              />
            </div>
            <div>
              <Label htmlFor="mess_status">Mess Fee Status</Label>
              <select
                id="mess_status"
                value={editForm.mess_status}
                onChange={(e) => setEditForm({ ...editForm, mess_status: e.target.value })}
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
                value={editForm.total_amount}
                onChange={(e) => setEditForm({ ...editForm, total_amount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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
