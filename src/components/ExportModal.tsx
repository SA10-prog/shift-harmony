import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface Props {
  weekId: string;
  onClose: () => void;
}

export default function ExportModal({ weekId, onClose }: Props) {
  const { getShiftsForWeek, getWorkerById } = useData();
  const shifts = getShiftsForWeek(weekId);

  const totalHours = shifts.reduce((s, sh) => s + sh.hours_worked, 0);
  const totalAmount = shifts.reduce((s, sh) => s + sh.shift_amount, 0);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Week {weekId}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => alert("Excel download would start here")}>
            <FileSpreadsheet className="w-6 h-6 text-status-closed" />
            <span className="font-semibold">Download Excel</span>
            <span className="text-xs text-muted-foreground">Full shift report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => alert("Payment list would download here")}>
            <FileText className="w-6 h-6 text-status-exported" />
            <span className="font-semibold">Payment List</span>
            <span className="text-xs text-muted-foreground">Per-worker summary</span>
          </Button>
        </div>

        <div className="text-sm font-medium text-muted-foreground mb-2">Preview ({shifts.length} shifts)</div>
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.slice(0, 10).map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm font-medium">{getWorkerById(s.worker_id)?.full_name}</TableCell>
                    <TableCell className="text-sm">{s.restaurant}</TableCell>
                    <TableCell className="text-right text-sm">{s.hours_worked.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm">€{s.shift_amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {shifts.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                      ...and {shifts.length - 10} more
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="font-semibold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{totalHours.toFixed(2)}</TableCell>
                  <TableCell className="text-right">€{totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
