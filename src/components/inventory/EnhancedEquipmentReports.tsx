import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Download, FileText, Calendar, TrendingUp, BarChart3, 
  PieChart, Activity, AlertCircle, CheckCircle, Clock,
  MapPin, Briefcase, Package, FileSpreadsheet, File,
  Wrench, XCircle, DollarSign, Users, Truck
} from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { useJobs } from '@/hooks/useJobs';
import { toast } from 'sonner';

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

const EnhancedEquipmentReports: React.FC = () => {
  const { data } = useInventory();
  const { jobs } = useJobs();
  const [reportType, setReportType] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('all');

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const total = data?.individualEquipment?.length || 0;
    const available = data?.individualEquipment?.filter(eq => eq.status === 'available').length;
    const deployed = data?.individualEquipment?.filter(eq => eq.status === 'deployed').length;
    const maintenance = data?.individualEquipment?.filter(eq => eq.status === 'maintenance').length;
    const redTagged = data?.individualEquipment?.filter(eq => eq.status === 'red-tagged').length;
    const retired = data?.individualEquipment?.filter(eq => eq.status === 'retired').length;

    // Calculate utilization rate
    const utilizationRate = total > 0 ? Math.round((deployed / total) * 100) : 0;
    
    // Calculate availability rate
    const availabilityRate = total > 0 ? Math.round((available / total) * 100) : 0;

    // Equipment by location
    const byLocation = (data?.individualEquipment || []).reduce((acc, eq) => {
      const locationName = data?.storageLocations?.find(l => l.id === eq.locationId)?.name || 'Unknown';
      acc[locationName] = (acc[locationName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Equipment by type
    const byType = (data?.individualEquipment || []).reduce((acc, eq) => {
      const typeName = data?.equipmentTypes?.find(t => t.id === eq.typeId)?.name || 'Unknown';
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Equipment by category
    const byCategory = (data?.equipmentTypes || []).reduce((acc, type) => {
      acc[type.category] = (acc[type.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Jobs with equipment
    const jobsWithEquipment = jobs.filter(job => 
      data.individualEquipment.some(eq => eq.jobId === job.id)
    ).length;

    // Equipment age analysis (if purchase dates available)
    const withPurchaseDate = data?.individualEquipment?.filter(eq => eq.purchaseDate).length;

    return {
      total,
      available,
      deployed,
      maintenance,
      redTagged,
      retired,
      utilizationRate,
      availabilityRate,
      byLocation,
      byType,
      byCategory,
      jobsWithEquipment,
      withPurchaseDate,
      totalJobs: jobs.length
    };
  }, [data, jobs]);

  // Prepare chart data for status distribution
  const statusChartData: ChartData[] = [
    { label: 'Available', value: stats.available, color: 'bg-status-success/200', percentage: (stats.available / stats.total) * 100 },
    { label: 'Deployed', value: stats.deployed, color: 'bg-status-info/200', percentage: (stats.deployed / stats.total) * 100 },
    { label: 'Maintenance', value: stats.maintenance, color: 'bg-status-warning/200', percentage: (stats.maintenance / stats.total) * 100 },
    { label: 'Red Tagged', value: stats.redTagged, color: 'bg-status-danger/200', percentage: (stats.redTagged / stats.total) * 100 },
    { label: 'Retired', value: stats.retired, color: 'bg-card0', percentage: (stats.retired / stats.total) * 100 },
  ].filter(item => item.value > 0);

  // Generate detailed reports
  const generateDetailedInventoryReport = () => {
    const headers = [
      'Equipment ID', 'Name', 'Type', 'Category', 'Location', 'Status', 
      'Serial Number', 'Job ID', 'Job Name', 'Purchase Date', 'Notes', 'Last Updated'
    ];
    
    const rows = data.individualEquipment.map(equipment => {
      const type = data?.equipmentTypes?.find(t => t.id === equipment.typeId);
      const location = data?.storageLocations?.find(l => l.id === equipment.locationId);
      const job = jobs.find(j => j.id === equipment.jobId);
      
      return [
        equipment.equipmentId,
        equipment.name,
        type?.name || 'Unknown',
        type?.category || 'Unknown',
        location?.name || 'Unknown',
        equipment.status,
        equipment.serialNumber || '',
        equipment.jobId || '',
        job?.name || '',
        equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString() : '',
        equipment.notes || '',
        new Date(equipment.lastUpdated).toLocaleDateString()
      ];
    });
    
    return [headers, ...rows];
  };

  const generateMaintenanceReport = () => {
    const needingAttention = data?.individualEquipment?.filter(
      eq => eq.status === 'maintenance' || eq.status === 'red-tagged'
    );
    
    const headers = [
      'Equipment ID', 'Name', 'Type', 'Status', 'Location', 
      'Days in Current Status', 'Serial Number', 'Notes'
    ];
    
    const rows = needingAttention.map(equipment => {
      const type = data?.equipmentTypes?.find(t => t.id === equipment.typeId);
      const location = data?.storageLocations?.find(l => l.id === equipment.locationId);
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(equipment.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return [
        equipment.equipmentId,
        equipment.name,
        type?.name || 'Unknown',
        equipment.status,
        location?.name || 'Unknown',
        daysSinceUpdate.toString(),
        equipment.serialNumber || '',
        equipment.notes || ''
      ];
    });
    
    return [headers, ...rows];
  };

  const generateUtilizationReport = () => {
    const headers = [
      'Job Name', 'Client', 'Equipment Count', 'Equipment IDs', 
      'Start Date', 'End Date', 'Duration (Days)'
    ];
    
    const rows = jobs.map(job => {
      const jobEquipment = data?.individualEquipment?.filter(eq => eq.jobId === job.id);
      const duration = job.endDate && job.startDate ? 
        Math.floor((new Date(job.endDate).getTime() - new Date(job.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 
        'Ongoing';
      
      return [
        job.name,
        job.client || '',
        jobEquipment.length.toString(),
        jobEquipment.map(eq => eq.equipmentId).join(', '),
        job.startDate ? new Date(job.startDate).toLocaleDateString() : '',
        job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Ongoing',
        duration.toString()
      ];
    }).filter(row => parseInt(row[2]) > 0); // Only include jobs with equipment
    
    return [headers, ...rows];
  };

  const generateLocationReport = () => {
    const headers = ['Location', 'Equipment Count', 'Available', 'Deployed', 'Maintenance', 'Equipment IDs'];
    
    const locationData = data.storageLocations.map(location => {
      const locationEquipment = data?.individualEquipment?.filter(eq => eq.locationId === location.id);
      const available = locationEquipment.filter(eq => eq.status === 'available').length;
      const deployed = locationEquipment.filter(eq => eq.status === 'deployed').length;
      const maintenance = locationEquipment.filter(eq => eq.status === 'maintenance').length;
      
      return [
        location.name,
        locationEquipment.length.toString(),
        available.toString(),
        deployed.toString(),
        maintenance.toString(),
        locationEquipment.map(eq => eq.equipmentId).join(', ')
      ];
    });
    
    return [headers, ...locationData];
  };

  const exportToCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
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

  const exportToJSON = (data: unknown, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
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
      let reportData: string[][];
      let jsonData: unknown;
      let filename: string;
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (reportType) {
        case 'inventory':
          reportData = generateDetailedInventoryReport();
          filename = `equipment-inventory-${timestamp}`;
          jsonData = data.individualEquipment;
          break;
        case 'maintenance':
          reportData = generateMaintenanceReport();
          filename = `maintenance-report-${timestamp}`;
          jsonData = data?.individualEquipment?.filter(eq => 
            eq.status === 'maintenance' || eq.status === 'red-tagged'
          );
          break;
        case 'utilization':
          reportData = generateUtilizationReport();
          filename = `utilization-report-${timestamp}`;
          jsonData = jobs.map(job => ({
            ...job,
            equipment: data?.individualEquipment?.filter(eq => eq.jobId === job.id)
          }));
          break;
        case 'location':
          reportData = generateLocationReport();
          filename = `location-report-${timestamp}`;
          jsonData = data.storageLocations.map(loc => ({
            ...loc,
            equipment: data?.individualEquipment?.filter(eq => eq.locationId === loc.id)
          }));
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (exportFormat === 'csv') {
        exportToCSV(reportData, `${filename}.csv`);
      } else if (exportFormat === 'json') {
        exportToJSON(jsonData, `${filename}.json`);
      } else {
        toast.error('PDF export coming soon!');
        return;
      }

      toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Equipment</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold">{stats.utilizationRate}%</p>
                <Progress value={stats.utilizationRate} className="mt-2 h-2" />
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{stats.jobsWithEquipment}/{stats.totalJobs}</p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.maintenance + stats.redTagged}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Equipment Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusChartData.map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{item.label}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={item.percentage} 
                          className="flex-1 h-6"
                        />
                        <Badge variant="outline" className="min-w-[60px] text-center">
                          {item.value} ({Math.round(item.percentage)}%)
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipment by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Equipment Types by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <div key={category} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{count}</div>
                    <div className="text-sm text-muted-foreground capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Location Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Equipment by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byLocation).map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-corporate-silver" />
                      <span className="font-medium">{location}</span>
                    </div>
                    <Badge>{count} items</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Equipment Types */}
          <Card>
            <CardHeader>
              <CardTitle>Top Equipment Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byType)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Equipment Health Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Availability Rate</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.availabilityRate}%</div>
                  <Progress value={stats.availabilityRate} className="mt-2 h-2" />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Maintenance Rate</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((stats.maintenance / stats.total) * 100) : 0}%
                  </div>
                  <Progress 
                    value={stats.total > 0 ? (stats.maintenance / stats.total) * 100 : 0} 
                    className="mt-2 h-2" 
                  />
                </div>
              </div>

              <div className="p-4 bg-status-info/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Equipment Lifecycle</span>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.withPurchaseDate} items with tracked purchase dates
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate & Export Reports
              </CardTitle>
              <CardDescription>
                Create detailed reports and export them in multiple formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Complete Inventory Report
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Maintenance & Issues Report
                        </div>
                      </SelectItem>
                      <SelectItem value="utilization">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Equipment Utilization Report
                        </div>
                      </SelectItem>
                      <SelectItem value="location">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location-based Report
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Export Format</label>
                  <Select value={exportFormat} onValueChange={(value: unknown) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV (Excel Compatible)
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          JSON (Data Export)
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf" disabled>
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          PDF (Coming Soon)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleExport} 
                disabled={!reportType || isExporting}
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Generating Report...' : 'Generate & Download Report'}
              </Button>

              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Quick Export Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReportType('inventory');
                      setExportFormat('csv');
                      setTimeout(handleExport, 100);
                    }}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Quick Inventory CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReportType('maintenance');
                      setExportFormat('csv');
                      setTimeout(handleExport, 100);
                    }}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Maintenance Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedEquipmentReports;