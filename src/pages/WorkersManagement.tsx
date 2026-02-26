import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus, ToggleLeft, ToggleRight } from "lucide-react";

export default function WorkersManagement() {
  const { workers, addWorker, toggleWorkerActive } = useData();
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");

  const filtered = workers.filter(w =>
    w.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newName.trim()) return;
    addWorker(newName.trim());
    setNewName("");
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Workers</h1>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search workers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Input placeholder="New worker name" value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()} />
            <Button onClick={handleAdd} disabled={!newName.trim()}>
              <UserPlus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.full_name}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        w.active ? "bg-status-closed/15 text-status-closed" : "bg-muted text-muted-foreground"
                      }`}>
                        {w.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => toggleWorkerActive(w.id)}>
                        {w.active ? <ToggleRight className="w-5 h-5 text-status-closed" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
