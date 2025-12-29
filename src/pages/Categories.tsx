import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { Tags, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

const ICON_OPTIONS = [
  { value: 'utensils', label: 'Food' },
  { value: 'car', label: 'Transport' },
  { value: 'graduation-cap', label: 'Education' },
  { value: 'home', label: 'Home' },
  { value: 'zap', label: 'Utilities' },
  { value: 'sparkles', label: 'Cleaning' },
  { value: 'heart-pulse', label: 'Health' },
  { value: 'shopping-bag', label: 'Shopping' },
  { value: 'tv', label: 'Entertainment' },
  { value: 'receipt', label: 'Bills' },
  { value: 'repeat', label: 'Subscription' },
  { value: 'lightbulb', label: 'Electricity' },
  { value: 'folder', label: 'Misc' },
  { value: 'gift', label: 'Gifts' },
  { value: 'plane', label: 'Travel' },
  { value: 'coffee', label: 'Cafe' },
  { value: 'dumbbell', label: 'Fitness' },
  { value: 'baby', label: 'Kids' },
  { value: 'dog', label: 'Pets' },
  { value: 'briefcase', label: 'Work' },
];

export default function Categories() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'folder' });

  const handleCreate = () => {
    if (!newCategory.name.trim()) return;
    createCategory.mutate(newCategory, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewCategory({ name: '', icon: 'folder' });
      },
    });
  };

  const handleUpdate = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    updateCategory.mutate(editingCategory, {
      onSuccess: () => setEditingCategory(null),
    });
  };

  const handleDelete = (id: string) => {
    deleteCategory.mutate(id);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Expense Categories</h1>
            <p className="text-muted-foreground">Manage your custom categories</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={newCategory.icon} onValueChange={(v) => setNewCategory({ ...newCategory, icon: v })}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <CategoryIcon icon={newCategory.icon} className="w-4 h-4" />
                          {ICON_OPTIONS.find(i => i.value === newCategory.icon)?.label}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <CategoryIcon icon={icon.value} className="w-4 h-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!newCategory.name.trim() || createCategory.isPending}>
                  {createCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            {editingCategory && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={editingCategory.icon} onValueChange={(v) => setEditingCategory({ ...editingCategory, icon: v })}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <CategoryIcon icon={editingCategory.icon} className="w-4 h-4" />
                          {ICON_OPTIONS.find(i => i.value === editingCategory.icon)?.label}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <CategoryIcon icon={icon.value} className="w-4 h-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
                {updateCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Categories Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((cat) => (
            <Card key={cat.id} className="animate-fade-in">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CategoryIcon icon={cat.icon || 'folder'} className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {cat.is_default ? 'Default category' : 'Custom category'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCategory({ id: cat.id, name: cat.name, icon: cat.icon || 'folder' })}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {!cat.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {!categories?.length && (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tags className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No categories yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create custom categories to organize your expenses
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
