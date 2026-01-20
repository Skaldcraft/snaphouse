import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';

const DummyDataSeeder = ({ onComplete }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const properties = [
    {
      title: "Modern Downtown Penthouse",
      description: "Luxurious 3-bedroom penthouse with panoramic city views, floor-to-ceiling windows, and a private terrace. Includes a state-of-the-art kitchen and smart home integration.",
      price: 1250000,
      location: "Downtown Metro",
      property_type: "condo",
      bedrooms: 3,
      bathrooms: 2,
      area: 2100,
      status: "available",
      image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      documents: [],
      features: ['Pool', 'Terrace', 'Smart Home']
    },
    {
      title: "Charming Suburban Family Home",
      description: "Spacious 4-bedroom family home in a quiet cul-de-sac. Features a large backyard with a pool, newly renovated kitchen, and a cozy fireplace in the living room.",
      price: 685000,
      location: "Oakwood Heights",
      property_type: "house",
      bedrooms: 4,
      bathrooms: 3,
      area: 2800,
      status: "available",
      image_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      documents: [],
      features: ['Backyard', 'Fireplace', 'Garage']
    },
    {
      title: "Riverside Loft Apartment",
      description: "Industrial-style loft with exposed brick walls and high ceilings. Located in the trendy Arts District, walking distance to cafes and galleries.",
      price: 450000,
      location: "Arts District",
      property_type: "apartment",
      bedrooms: 1,
      bathrooms: 1,
      area: 950,
      status: "pending",
      image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      documents: [],
      features: ['High Ceilings', 'Exposed Brick']
    },
    {
      title: "Cozy Cottage Retreat",
      description: "Beautiful 2-bedroom cottage surrounded by nature. Perfect for a weekend getaway or peaceful living. Features a wrap-around porch and garden.",
      price: 325000,
      location: "Pine Valley",
      property_type: "house",
      bedrooms: 2,
      bathrooms: 1,
      area: 1200,
      status: "available",
      image_url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      documents: [],
      features: ['Garden', 'Porch']
    },
    {
      title: "Modernist Glass Villa",
      description: "Architectural masterpiece with open concept living. Features infinity pool, home theater, and wine cellar. Private and gated community.",
      price: 2800000,
      location: "Beverly Hills",
      property_type: "house",
      bedrooms: 5,
      bathrooms: 5,
      area: 4500,
      status: "sold",
      image_url: "https://images.unsplash.com/photo-1600596542815-e32c09e3a634?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      documents: [],
      features: ['Infinity Pool', 'Home Theater', 'Wine Cellar']
    }
  ];

  const clients = [
    {
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "+1 (555) 123-4567",
      budget: 750000,
      preferences: "Looking for a 3-bedroom house with a backyard in a school district. Prefer modern style.",
      status: "active",
      client_type: "buyer",
      notes: "Pre-approved for mortgage. Ready to move in 2 months.",
      tags: ['Family', 'School District']
    },
    {
      name: "Michael Chen",
      email: "m.chen@techcorp.com",
      phone: "+1 (555) 987-6543",
      budget: 1500000,
      preferences: "Downtown penthouse or luxury condo. Must have city views and parking.",
      status: "active",
      client_type: "investor",
      notes: "Cash buyer. Investors looking for rental potential as well.",
      tags: ['Cash', 'Luxury']
    },
    {
      name: "Emily Rodriguez",
      email: "emily.r@example.com",
      phone: "+1 (555) 456-7890",
      budget: 400000,
      preferences: "Starter home or large apartment. Close to public transport.",
      status: "active",
      client_type: "buyer",
      notes: "First-time homebuyer. Needs guidance on the process.",
      tags: ['First-time']
    },
    {
      name: "David Wilson",
      email: "david.w@example.com",
      phone: "+1 (555) 222-3333",
      budget: 900000,
      preferences: "Suburban home with 4+ bedrooms. Needs home office space.",
      status: "inactive",
      client_type: "buyer",
      notes: "Just browsing currently. Planning to buy next year.",
      tags: ['Browser']
    }
  ];

  const seedData = () => {
    setLoading(true);
    
    try {
      // Seed properties
      const currentProps = JSON.parse(localStorage.getItem('snaphouse_properties') || '[]');
      const newProps = properties.map(p => ({
          ...p,
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
      }));
      localStorage.setItem('snaphouse_properties', JSON.stringify([...currentProps, ...newProps]));

      // Seed clients
      const currentClients = JSON.parse(localStorage.getItem('snaphouse_clients') || '[]');
      const newClients = clients.map(c => ({
          ...c,
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          requirements: {}
      }));
      localStorage.setItem('snaphouse_clients', JSON.stringify([...currentClients, ...newClients]));

      toast({
        title: t('dashboard.data_seeded'),
        description: t('dashboard.data_seeded_desc'),
      });
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={seedData} 
      disabled={loading}
      className="bg-amber-600 hover:bg-amber-700 text-white"
    >
      <Database className="h-4 w-4 mr-2" />
      {loading ? t('dashboard.adding_data') : t('dashboard.add_data')}
    </Button>
  );
};

export default DummyDataSeeder;