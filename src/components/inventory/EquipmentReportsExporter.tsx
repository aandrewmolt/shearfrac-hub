
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { toast } from 'sonner';

const EquipmentReportsExporter: React.FC = () => {
  const { data } = useInventory();
  const [reportType, setReportType] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const generateInventoryReport = () => {
    const csvData = [
      ['Equipment ID', 'Name', 'Type', 'Category', 'Location', 'Status', 'Serial Number', 'Job ID', 'Notes', 'Last Updated'],
      ...data.individualEquipment.map(equipment => {
        const type = data?.equipmentTypes?.find(t => t.id === equipment.typeId);
        const location = data?.storageLocations?.find(l => l.id === equipment.locationId);
        return [
          equipment.equipmentId,
          equipment.name,
          type?.name || 'Unknown',
          type?.category || 'Unknown',
          location?.name || 'Unknown',
          equipment.status,
          equipment.serialNumber || '',
          equipment.jobId || '',
          equipment.notes || '',
          new Date(equipment.lastUpdated).toLocaleDateString()
        ];
      })
    ];
    return csvData;
  };


  const generateDeploymentReport = () => {
    const deployedEquipment = data?.individualEquipment?.filter(eq => eq.status === 'deployed');
    
    const csvData = [
      ['Equipment ID', 'Name', 'Type', 'Job ID', 'Location', 'Serial Number', 'Deployed Date'],
      ...deployedEquipment.map(equipment => {
        const type = data?.equipmentTypes?.find(t => t.id === equipment.typeId);
        const location = data?.storageLocations?.find(l => l.id === equipment.locationId);
        return [
          equipment.equipmentId,
          equipment.name,
          type?.name || 'Unknown',
          equipment.jobId || '',
          location?.name || 'Unknown',
          equipment.serialNumber || '',
          new Date(equipment.lastUpdated).toLocaleDateString()
        ];
      })
    ];
    return csvData;
  };

  const exportToCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }

    setIsExporting(true);
    try {
      let csvData: string[][];
      let filename: string;
      
      switch (reportType) {
        case 'inventory':
          csvData = generateInventoryReport();
          filename = `equipment-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'deployments':
          csvData = generateDeploymentReport();
          filename = `deployment-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      exportToCSV(csvData, filename);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const getReportStats = () => {
    const totalEquipment = data?.individualEquipment?.length || 0;
    const deployedEquipment = data?.individualEquipment?.filter(eq => eq.status === 'deployed').length;
    const redTaggedEquipment = data?.individualEquipment?.filter(eq => eq.status === 'red-tagged').length;
    const availableEquipment = data?.individualEquipment?.filter(eq => eq.status === 'available').length;

    return { totalEquipment, deployedEquipment, redTaggedEquipment, availableEquipment };
  };

  const stats = getReportStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Equipment Reports & Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalEquipment}</div>
            <div className="text-sm text-muted-foreground">Total Equipment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.availableEquipment}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.deployedEquipment}</div>
            <div className="text-sm text-muted-foreground">Deployed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{stats.redTaggedEquipment}</div>
            <div className="text-sm text-muted-foreground">Red Tagged</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory">Complete Equipment Report</SelectItem>
                <SelectItem value="deployments">Current Deployments Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={!reportType || isExporting}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export to CSV'}
          </Button>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Quick Stats by Category
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(
              data.equipmentTypes.reduce((acc, type) => {
                acc[type.category] = (acc[type.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
                <span className="text-sm font-medium">{count} types</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentReportsExporter;
