import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cable, Package, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';

const MainDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-corporate">
      <AppHeader />
      
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-corporate-light uppercase tracking-wider mb-4">Rig-Up Management</h1>
            <p className="text-xl text-corporate-silver mb-6">
              Manage your jobs, equipment inventory, and contacts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-card border-2 border-border hover:border-accent-gold"
              onClick={() => navigate('/jobs')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-accent-gold/20 rounded-full w-fit">
                  <Cable className="h-12 w-12 text-accent-gold" />
                </div>
                <CardTitle className="text-2xl text-corporate-light">Job Mapper</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-corporate-silver mb-4">
                  Create visual diagrams for your well configurations
                </p>
                <Button className="w-full bg-accent-gold hover:bg-accent-gold-dark text-corporate-dark">
                  Open Job Mapper
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-card border-2 border-border hover:border-accent-gold"
              onClick={() => navigate('/inventory/equipment')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-status-success/20 rounded-full w-fit">
                  <Package className="h-12 w-12 text-status-success" />
                </div>
                <CardTitle className="text-2xl text-corporate-light">Equipment Inventory</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-corporate-silver mb-4">
                  Track equipment across storage locations and job sites
                </p>
                <Button className="w-full bg-status-success hover:bg-green-700 text-white">
                  Open Inventory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-card border-2 border-border hover:border-accent-gold"
              onClick={() => navigate('/contacts')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-status-info/20 rounded-full w-fit">
                  <Users className="h-12 w-12 text-status-info" />
                </div>
                <CardTitle className="text-2xl text-corporate-light">Contacts</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-corporate-silver mb-4">
                  Manage client, frac, and custom contacts
                </p>
                <Button className="w-full bg-status-info hover:bg-blue-700 text-white">
                  Open Contacts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;