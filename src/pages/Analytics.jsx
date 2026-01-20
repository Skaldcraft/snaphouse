import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, PieChart } from 'lucide-react';
import Layout from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import SimpleChart from '@/components/SimpleChart';

const Analytics = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    totalClients: 0,
    activeClients: 0,
    totalValue: 0,
    salesVolume: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    propertyStatus: [],
    clientStatus: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = () => {
    try {
      const properties = JSON.parse(localStorage.getItem('snaphouse_properties') || '[]');
      const clients = JSON.parse(localStorage.getItem('snaphouse_clients') || '[]');

      // Calculate Stats
      const totalValue = properties.reduce((sum, prop) => sum + (parseFloat(prop.price) || 0), 0);
      const availableCount = properties.filter(p => p.status === 'available').length;
      const soldProperties = properties.filter(p => p.status === 'sold');
      const salesVolume = soldProperties.reduce((sum, prop) => sum + (parseFloat(prop.price) || 0), 0);
      
      const activeClientsCount = clients.filter(c => c.status === 'active').length;
      const convertedClients = clients.filter(c => c.status === 'converted').length;
      const totalClients = clients.length;
      const conversionRate = totalClients > 0 ? Math.round((convertedClients / totalClients) * 100) : 0;

      setStats({
        totalProperties: properties.length,
        availableProperties: availableCount,
        totalClients,
        activeClients: activeClientsCount,
        totalValue,
        salesVolume,
        conversionRate
      });

      setChartData({
        propertyStatus: [
          { label: 'Available', shortLabel: 'Avail', value: availableCount },
          { label: 'Pending', shortLabel: 'Pend', value: properties.filter(p => p.status === 'pending').length },
          { label: 'Sold', shortLabel: 'Sold', value: soldProperties.length }
        ],
        clientStatus: [
          { label: 'Active', shortLabel: 'Act', value: activeClientsCount },
          { label: 'Inactive', shortLabel: 'Inact', value: clients.filter(c => c.status === 'inactive').length },
          { label: 'Converted', shortLabel: 'Conv', value: convertedClients }
        ]
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('analytics.sales_volume'),
      value: `$${(stats.salesVolume / 1000000).toFixed(1)}M`,
      subtitle: t('analytics.total_sold'),
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
    },
    {
      title: t('analytics.conversion_rate'),
      value: `${stats.conversion_rate}%`,
      subtitle: t('analytics.success_rate'),
      icon: PieChart,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: t('analytics.active_pipeline'),
      value: stats.activeClients,
      subtitle: t('analytics.potential_buyers'),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: t('analytics.portfolio_value'),
      value: `$${(stats.totalValue / 1000000).toFixed(1)}M`,
      subtitle: t('analytics.total_asset'),
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('analytics.title')} - SnapHouse</title>
      </Helmet>
      <Layout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t('analytics.title')}</h1>
            <p className="text-slate-600 mt-2">{t('analytics.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  <p className="text-slate-600 text-sm font-medium mt-1">{stat.title}</p>
                  <p className="text-slate-400 text-xs mt-1">{stat.subtitle}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <SimpleChart 
              title={t('analytics.property_dist')} 
              data={chartData.propertyStatus} 
              color="blue" 
            />
            <SimpleChart 
              title={t('analytics.client_lifecycle')} 
              data={chartData.clientStatus} 
              color="green" 
            />
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Analytics;