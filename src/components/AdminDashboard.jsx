import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { fetchProductsList } from '../utils/config';
import * as XLSX from 'xlsx';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * AdminDashboard Component - Goatzy US Campaign
 * Displays customer data, analytics, and visualizations
 */
const AdminDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [giftStats, setGiftStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAmazonStatsExpanded, setIsAmazonStatsExpanded] = useState(false);
  const [isFunnelAmazonExpanded, setIsFunnelAmazonExpanded] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const selectedRegion = 'US';
  const [productFilter, setProductFilter] = useState('all');
  const [productsList, setProductsList] = useState([]);

  // Email tracking state
  const [emailStats, setEmailStats] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [isSendingPending, setIsSendingPending] = useState(false);

  // Review verification state
  const [amazonReviews, setAmazonReviews] = useState(null);
  const [reviewMatches, setReviewMatches] = useState(null);

  useEffect(() => {
    fetchProductsList().then(list => setProductsList(list || []));
  }, []);

  useEffect(() => {
    fetchCustomersAndAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, productFilter]);

  const exportToCSV = () => {
    if (customers.length === 0) {
      alert('No customers to export');
      return;
    }

    const headers = [
      'ID', 'Created At', 'First Name', 'Last Name', 'Email',
      'Opt-in Surveys', 'Review Generated', 'Review Stars',
      'Review Tone', 'Review Text', 'Went to Amazon', 'Claimed Gifts'
    ];

    const rows = customers.map(customer => [
      customer.id,
      new Date(customer.created_at).toISOString(),
      customer.first_name,
      customer.last_name,
      customer.email,
      customer.opt_in_surveys ? 'Yes' : 'No',
      customer.review_generated ? 'Yes' : 'No',
      customer.review_stars || '',
      customer.review_tone || '',
      customer.review_text ? `"${customer.review_text.replace(/"/g, '""')}"` : '',
      customer.went_to_amazon ? 'Yes' : 'No',
      customer.claimed_gifts ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `goatzy_customers_${selectedRegion}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      }
      return [...prev, customerId];
    });
  };

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const deleteSelectedCustomers = async () => {
    if (selectedCustomers.length === 0) {
      alert('No customers selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)? They will be moved to trash.`)) {
      return;
    }

    try {
      if (!supabase) {
        alert('Supabase not configured');
        return;
      }

      for (const customerId of selectedCustomers) {
        const { data: customerData, error: fetchError } = await supabase
          .from('customer_submissions')
          .select('*')
          .eq('id', customerId)
          .single();

        if (fetchError) {
          console.error('Error fetching customer:', fetchError);
          continue;
        }

        const { error: insertError } = await supabase
          .from('deleted_customer_submissions')
          .insert({
            original_id: customerData.id,
            created_at: customerData.created_at,
            first_name: customerData.first_name,
            last_name: customerData.last_name,
            email: customerData.email,
            opt_in_surveys: customerData.opt_in_surveys,
            review_generated: customerData.review_generated,
            review_stars: customerData.review_stars,
            review_tone: customerData.review_tone,
            review_text: customerData.review_text,
            went_to_amazon: customerData.went_to_amazon,
            claimed_gifts: customerData.claimed_gifts
          });

        if (insertError) {
          console.error('Error inserting to trash:', insertError);
          continue;
        }

        await supabase
          .from('gift_downloads')
          .delete()
          .eq('customer_id', customerId);

        const { error: deleteError } = await supabase
          .from('customer_submissions')
          .delete()
          .eq('id', customerId);

        if (deleteError) {
          console.error('Error deleting customer:', deleteError);
        }
      }

      setSelectedCustomers([]);
      await fetchCustomersAndAnalytics();
      alert(`${selectedCustomers.length} customer(s) deleted successfully`);
    } catch (error) {
      console.error('Error deleting customers:', error);
      alert('Delete failed: ' + error.message);
    }
  };

  const fetchCustomersAndAnalytics = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!supabase) {
        const mockCustomers = generateMockData();
        setCustomers(mockCustomers);
        setAnalytics(calculateAnalytics(mockCustomers));
        await fetchGiftStats();
        await fetchEmailStats();
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('customer_submissions')
        .select('*')
        .eq('region', selectedRegion);
      if (productFilter !== 'all') {
        query = query.eq('product_slug', productFilter);
      }
      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCustomers(data || []);
      setAnalytics(calculateAnalytics(data || []));
      await fetchGiftStats();
      await fetchEmailStats();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. ' + err.message);
      const mockCustomers = generateMockData();
      setCustomers(mockCustomers);
      setAnalytics(calculateAnalytics(mockCustomers));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGiftStats = async () => {
    if (!supabase) {
      setGiftStats({
        assembly_video: { total: 12, unique: 10 },
        upsell_hay_feeder: { total: 5, unique: 4 },
        upsell_wall_feeder: { total: 3, unique: 3 }
      });
      return;
    }

    try {
      let query = supabase
        .from('gift_downloads')
        .select('gift_type, customer_id')
        .eq('region', selectedRegion);
      if (productFilter !== 'all') {
        query = query.eq('product_slug', productFilter);
      }
      const { data, error } = await query;

      if (error) throw error;

      // Build stats dynamically from the data
      const stats = {};
      const uniqueUsers = {};

      data.forEach(download => {
        const type = download.gift_type;
        if (!stats[type]) {
          stats[type] = { total: 0, unique: 0 };
          uniqueUsers[type] = new Set();
        }
        stats[type].total++;
        if (download.customer_id) {
          uniqueUsers[type].add(download.customer_id);
        }
      });

      Object.keys(stats).forEach(type => {
        stats[type].unique = uniqueUsers[type].size;
      });

      setGiftStats(stats);
    } catch (err) {
      console.error('Error fetching gift stats:', err);
      setGiftStats({});
    }
  };

  // --- Email Tracking ---

  const fetchEmailStats = async () => {
    if (!supabase) {
      setEmailStats({ sent: 3, failed: 1, pending: 2, total: 6 });
      setEmailLogs([]);
      return;
    }

    try {
      // Fetch email logs
      let logsQuery = supabase
        .from('email_logs')
        .select('id, customer_id, product_slug, status, resend_id, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (productFilter !== 'all') {
        logsQuery = logsQuery.eq('product_slug', productFilter);
      }
      const { data: logs } = await logsQuery;
      setEmailLogs(logs || []);

      // Calculate stats from customer_submissions
      const sent = customers.filter(c => c.email_sent).length;
      const total = customers.length;
      const failed = (logs || []).filter(l => l.status === 'failed').length;
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const pending = customers.filter(c => !c.email_sent && c.created_at < fiveMinAgo).length;

      setEmailStats({ sent, failed, pending, total });
    } catch (err) {
      console.error('Error fetching email stats:', err);
      setEmailStats(null);
    }
  };

  const handleSendPendingEmails = async () => {
    if (!supabase) return;

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const pendingCustomers = customers.filter(c => !c.email_sent && c.created_at < fiveMinAgo);

    if (pendingCustomers.length === 0) {
      alert('No pending emails to send.');
      return;
    }

    if (!window.confirm(`Send ebook emails to ${pendingCustomers.length} customer(s)?`)) return;

    setIsSendingPending(true);
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    let successCount = 0;
    let failCount = 0;

    for (const customer of pendingCustomers) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-ebook-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: customer.id, product_slug: customer.product_slug || 'goat-stand' })
        });
        const data = await res.json();
        if (data.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setIsSendingPending(false);
    alert(`Done! ${successCount} sent, ${failCount} failed.`);
    await fetchCustomersAndAnalytics();
  };

  // --- Review Verification ---

  const parseCSV = (text) => {
    const lines = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        lines.push(current); current = '';
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (current || lines.length > 0) { lines.push(current); current = ''; }
        if (lines.length > 0) return { line: lines, rest: text.slice(i + (text[i + 1] === '\n' ? 2 : 1)) };
      } else { current += ch; }
    }
    if (current || lines.length > 0) lines.push(current);
    return { line: lines, rest: '' };
  };

  const parseFullCSV = (text) => {
    const rows = [];
    let remaining = text.replace(/^\uFEFF/, '');
    while (remaining.length > 0) {
      const { line, rest } = parseCSV(remaining);
      if (line.length > 0) rows.push(line);
      if (rest === remaining) break;
      remaining = rest;
    }
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
      return obj;
    });
  };

  const normalizeText = (text) => {
    return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  };

  const jaccardSimilarity = (text1, text2) => {
    const words1 = new Set(normalizeText(text1).split(' ').filter(w => w.length > 2));
    const words2 = new Set(normalizeText(text2).split(' ').filter(w => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return 0;
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  const processReviewRows = (parsed) => {
    if (!parsed || parsed.length === 0) { alert('No data found in file.'); return; }
    const keys = Object.keys(parsed[0] || {});
    const reviewCol = keys.find(k =>
      k.toLowerCase().includes('reviewdescription') || k.toLowerCase().includes('review_text') ||
      k.toLowerCase().includes('review text') || k.toLowerCase().includes('body') || k.toLowerCase().includes('content')
    );
    const ratingCol = keys.find(k => k.toLowerCase().includes('ratingscore') || k.toLowerCase().includes('rating') || k.toLowerCase().includes('stars'));
    const titleCol = keys.find(k => k.toLowerCase().includes('reviewtitle') || k.toLowerCase().includes('title'));
    const dateCol = keys.find(k => k === 'date' || k.toLowerCase().includes('date'));
    if (!reviewCol) { alert('Review column not found. Expected: reviewDescription, review_text, body, or content.\n\nColumns found: ' + keys.join(', ')); return; }
    const reviews = parsed
      .filter(row => row[reviewCol] && String(row[reviewCol]).trim().length > 0)
      .map(row => ({ text: String(row[reviewCol]), rating: ratingCol ? parseInt(row[ratingCol]) : null, title: titleCol ? String(row[titleCol] || '') : '', date: dateCol ? String(row[dateCol] || '') : '' }));
    setAmazonReviews(reviews);
    matchReviews(reviews);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const parsed = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        processReviewRows(parsed);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => processReviewRows(parseFullCSV(e.target.result));
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const matchReviews = (amzReviews) => {
    const candidates = customers.filter(c => c.review_text && c.went_to_amazon);
    const matches = candidates.map(customer => {
      let bestMatch = null, bestScore = 0;
      amzReviews.forEach(amzReview => {
        const score = jaccardSimilarity(customer.review_text, amzReview.text);
        if (score > bestScore) { bestScore = score; bestMatch = amzReview; }
      });
      let status = 'not_found';
      if (bestScore >= 0.7) status = 'confirmed';
      else if (bestScore >= 0.4) status = 'probable';
      return { customer, bestMatch, score: bestScore, status, starsMatch: bestMatch && bestMatch.rating ? customer.review_stars === bestMatch.rating : null };
    });
    matches.sort((a, b) => {
      const order = { confirmed: 0, probable: 1, not_found: 2 };
      return order[a.status] - order[b.status] || b.score - a.score;
    });
    setReviewMatches(matches);
  };

  const calculateAnalytics = (data) => {
    const total = data.length;
    const reachedReviewPage = data.filter(c => c.review_generated).length;
    const wentToAmazon = data.filter(c => c.went_to_amazon).length;
    const claimedGifts = data.filter(c => c.claimed_gifts).length;
    const claimedAfterAmazon = data.filter(c => c.went_to_amazon && c.claimed_gifts).length;
    const claimedWithoutAmazon = data.filter(c => !c.went_to_amazon && c.claimed_gifts).length;
    const likelySubmittedToAmazon = data.filter(c => c.review_generated && c.went_to_amazon).length;

    const reviewsWithStars = data.filter(c => c.review_stars);
    const avgStars = reviewsWithStars.length > 0
      ? (reviewsWithStars.reduce((sum, c) => sum + c.review_stars, 0) / reviewsWithStars.length).toFixed(1)
      : 0;

    const toneDistribution = {};
    data.forEach(c => {
      if (c.review_tone) {
        toneDistribution[c.review_tone] = (toneDistribution[c.review_tone] || 0) + 1;
      }
    });

    return {
      total,
      reachedReviewPage,
      wentToAmazon,
      claimedGifts,
      claimedAfterAmazon,
      claimedWithoutAmazon,
      likelySubmittedToAmazon,
      avgStars,
      toneDistribution,
      conversionRate: total > 0 ? ((wentToAmazon / total) * 100).toFixed(1) : 0,
      giftsClaimRate: total > 0 ? ((claimedGifts / total) * 100).toFixed(1) : 0,
      amazonSubmissionRate: total > 0 ? ((likelySubmittedToAmazon / total) * 100).toFixed(1) : 0
    };
  };

  const generateMockData = () => {
    return [
      {
        id: 'mock-1',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        first_name: 'John',
        last_name: 'Miller',
        email: 'john.miller@example.com',
        opt_in_surveys: true,
        review_generated: true,
        review_stars: 5,
        review_tone: 'Enthusiastic',
        review_text: 'Best goat stand I have ever used. Super sturdy and easy to assemble.',
        went_to_amazon: true,
        claimed_gifts: true
      },
      {
        id: 'mock-2',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@example.com',
        opt_in_surveys: false,
        review_generated: true,
        review_stars: 4,
        review_tone: 'Helpful',
        review_text: 'Great stand for my Nigerian Dwarfs. Wheels make it easy to move around.',
        went_to_amazon: false,
        claimed_gifts: true
      },
      {
        id: 'mock-3',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        first_name: 'Mike',
        last_name: 'Thompson',
        email: 'mike.t@example.com',
        opt_in_surveys: true,
        review_generated: false,
        review_stars: null,
        review_tone: null,
        review_text: null,
        went_to_amazon: false,
        claimed_gifts: false
      }
    ];
  };

  const COLORS = ['#1B4332', '#2D6A4F', '#52B788', '#95D5B2'];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-goatzy-bg">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-goatzy mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-lg font-light text-goatzy-dark">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-goatzy-bg py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-4 text-goatzy-dark">
            Goatzy Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Customer analytics and review data
          </p>
          {!supabase && (
            <p className="mt-2 text-sm text-amber-600 italic">
              Demo Mode - Showing sample data
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {/* Product filter */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-4 py-3 border border-goatzy-dark text-goatzy-dark text-sm font-light tracking-wide rounded-lg
                       bg-white focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2 cursor-pointer"
            >
              <option value="all">All Products</option>
              {productsList.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>

            <button
              onClick={exportToCSV}
              disabled={customers.length === 0}
              className="px-6 py-3 bg-goatzy-dark text-white text-sm font-light tracking-wide rounded-lg
                       hover:bg-goatzy transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Export to CSV
            </button>
            <button
              onClick={() => window.location.href = '/admin/config'}
              className="px-6 py-3 border border-goatzy-dark text-goatzy-dark text-sm font-light tracking-wide rounded-lg
                       hover:bg-goatzy-dark hover:text-white transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}

        {/* Analytics Summary Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 border border-goatzy-pale rounded-xl">
              <h3 className="text-sm font-light tracking-wide text-gray-600 mb-2">Total Customers</h3>
              <p className="text-4xl font-light text-goatzy-dark">{analytics.total}</p>
            </div>

            <div className="bg-white p-6 border border-goatzy-pale rounded-xl">
              <h3 className="text-sm font-light tracking-wide text-gray-600 mb-2">Gifts Claimed</h3>
              <p className="text-4xl font-light text-goatzy-dark">{analytics.claimedGifts}</p>
              <p className="text-xs text-gray-500 mt-1">{analytics.giftsClaimRate}% claim rate</p>
            </div>

            <div
              className="bg-goatzy-bg p-6 border border-goatzy-accent rounded-xl cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => setIsAmazonStatsExpanded(!isAmazonStatsExpanded)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-light tracking-wide text-gray-600 mb-2">Amazon Reviews Submitted</h3>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isAmazonStatsExpanded ? 'transform rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="text-4xl font-light text-goatzy">{analytics.likelySubmittedToAmazon}</p>
              <p className="text-xs text-gray-500 mt-1">{analytics.amazonSubmissionRate}% submission rate</p>
              <p className="text-xs text-gray-500 mt-1 italic">(Generated + Clicked Amazon)</p>

              {isAmazonStatsExpanded && (
                <div className="mt-4 pt-4 border-t border-goatzy-pale space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Reviews Generated (info)</span>
                    <span className="text-sm font-light text-gray-700">{analytics.reachedReviewPage}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 relative rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-goatzy-accent" style={{ width: `${analytics.total > 0 ? (analytics.reachedReviewPage / analytics.total * 100) : 0}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {analytics.total > 0 ? ((analytics.reachedReviewPage / analytics.total) * 100).toFixed(0) : 0}%
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-600">Amazon Clicks (info)</span>
                    <span className="text-sm font-light text-gray-700">{analytics.wentToAmazon}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 relative rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-goatzy-accent" style={{ width: `${analytics.total > 0 ? (analytics.wentToAmazon / analytics.total * 100) : 0}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {analytics.total > 0 ? ((analytics.wentToAmazon / analytics.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 border border-goatzy-pale rounded-xl">
              <h3 className="text-sm font-light tracking-wide text-gray-600 mb-2">Reviews Generated</h3>
              <p className="text-4xl font-light text-goatzy-dark">{analytics.reachedReviewPage}</p>
              <p className="text-xs text-gray-500 mt-1">Avg Rating: {analytics.avgStars} stars</p>
            </div>
          </div>
        )}

        {/* Charts */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Funnel Chart */}
            <div className="bg-white p-6 border border-goatzy-pale rounded-xl">
              <h3 className="text-xl font-light tracking-wide mb-6 text-goatzy-dark">Conversion Funnel</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-light text-gray-700">1. Info Submitted</span>
                    <span className="text-sm font-light text-gray-900">{analytics.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-12 relative flex items-center justify-center rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-goatzy-dark" style={{ width: '100%' }} />
                    <span className="relative z-10 text-white text-sm font-light">100%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-light text-gray-700">2. Gifts Claimed</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-light text-gray-900">{analytics.claimedGifts}</span>
                      <span className="text-xs text-red-600 font-light">-{analytics.total - analytics.claimedGifts} drop-offs</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 h-12 relative flex items-center justify-center rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-goatzy-dark" style={{ width: `${analytics.total > 0 ? (analytics.claimedGifts / analytics.total * 100) : 0}%` }} />
                    <span className="relative z-10 text-sm font-light" style={{
                      color: (analytics.claimedGifts / analytics.total) > 0.5 ? 'white' : '#1B4332'
                    }}>
                      {analytics.total > 0 ? ((analytics.claimedGifts / analytics.total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-goatzy-pale">
                  <div
                    className="flex justify-between items-center mb-2 cursor-pointer hover:bg-goatzy-bg p-2 -m-2 rounded-lg transition-colors duration-200"
                    onClick={() => setIsFunnelAmazonExpanded(!isFunnelAmazonExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-light text-goatzy font-medium">Amazon Reviews Submitted <span className="text-xs italic font-normal">(generated + click)</span></span>
                      <svg
                        className={`w-4 h-4 text-goatzy transition-transform duration-200 ${isFunnelAmazonExpanded ? 'transform rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <span className="text-sm font-light text-goatzy font-medium">{analytics.likelySubmittedToAmazon}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-10 relative flex items-center justify-center border-2 border-goatzy rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-goatzy" style={{ width: `${analytics.total > 0 ? (analytics.likelySubmittedToAmazon / analytics.total * 100) : 0}%` }} />
                    <span className="relative z-10 text-sm font-light font-medium" style={{
                      color: (analytics.likelySubmittedToAmazon / analytics.total) > 0.5 ? 'white' : '#1B4332'
                    }}>
                      {analytics.total > 0 ? ((analytics.likelySubmittedToAmazon / analytics.total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>

                  {isFunnelAmazonExpanded && (
                    <div className="mt-4 pt-4 border-t border-goatzy-pale space-y-4 animate-fade-in">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-light text-gray-500">Reviews Generated (info)</span>
                          <span className="text-xs font-light text-gray-600">{analytics.reachedReviewPage}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-6 relative flex items-center justify-center rounded overflow-hidden">
                          <div className="absolute inset-0 bg-goatzy-accent" style={{ width: `${analytics.total > 0 ? (analytics.reachedReviewPage / analytics.total * 100) : 0}%` }} />
                          <span className="relative z-10 text-xs font-light" style={{
                            color: (analytics.reachedReviewPage / analytics.total) > 0.5 ? 'white' : '#1B4332'
                          }}>
                            {analytics.total > 0 ? ((analytics.reachedReviewPage / analytics.total) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-light text-gray-500">Amazon Clicks (info)</span>
                          <span className="text-xs font-light text-gray-600">{analytics.wentToAmazon}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-6 relative flex items-center justify-center rounded overflow-hidden">
                          <div className="absolute inset-0 bg-goatzy-accent" style={{ width: `${analytics.total > 0 ? (analytics.wentToAmazon / analytics.total * 100) : 0}%` }} />
                          <span className="relative z-10 text-xs font-light" style={{
                            color: (analytics.wentToAmazon / analytics.total) > 0.5 ? 'white' : '#1B4332'
                          }}>
                            {analytics.total > 0 ? ((analytics.wentToAmazon / analytics.total) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-goatzy-bg border border-goatzy-pale rounded-lg">
                  <p className="text-xs font-light text-gray-600 leading-relaxed">
                    <strong>Key insight:</strong> {analytics.claimedWithoutAmazon} customers ({analytics.total > 0 ? ((analytics.claimedWithoutAmazon / analytics.total) * 100).toFixed(0) : 0}%) claimed their gifts without going to Amazon. Gifts are not conditional on reviews.
                  </p>
                  <p className="text-xs font-light text-gray-600 leading-relaxed mt-2">
                    <strong>Amazon Reviews:</strong> {analytics.likelySubmittedToAmazon} customers ({analytics.amazonSubmissionRate}%) likely submitted their review on Amazon (generated + clicked Amazon).
                  </p>
                </div>
              </div>
            </div>

            {/* Gift Claim Distribution */}
            <div className="bg-white p-6 border border-goatzy-pale rounded-xl">
              <h3 className="text-xl font-light tracking-wide mb-6 text-goatzy-dark">Gift Claim Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'After Amazon', value: analytics.claimedAfterAmazon },
                      { name: 'Without Amazon', value: analytics.claimedWithoutAmazon },
                      { name: 'No Gifts Claimed', value: analytics.total - analytics.claimedGifts }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gift/Action Stats */}
        {giftStats && Object.keys(giftStats).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-light tracking-wide mb-6 text-goatzy-dark">Engagement Stats</h2>
            <div className={`grid gap-6 ${Object.keys(giftStats).length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
              {Object.entries(giftStats).map(([type, stats]) => (
                <div key={type} className="bg-white p-6 border border-goatzy-pale rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <svg className="w-12 h-12 text-goatzy-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {type.includes('video') ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </>
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      )}
                    </svg>
                  </div>
                  <h3 className="text-sm font-light tracking-wide text-gray-600 mb-2">
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <p className="text-4xl font-light text-goatzy-dark mb-1">{stats.unique}</p>
                  <p className="text-xs text-gray-500">Unique ({stats.total} total)</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Tracking */}
        {emailStats && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light tracking-wide text-goatzy-dark">Email Tracking</h2>
              <button
                onClick={handleSendPendingEmails}
                disabled={isSendingPending || (emailStats.pending || 0) === 0}
                className="px-4 py-2 bg-goatzy-dark text-white text-sm font-light rounded-lg hover:bg-goatzy transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSendingPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Pending ({emailStats.pending || 0})
                  </>
                )}
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 border border-goatzy-pale rounded-xl text-center">
                <p className="text-3xl font-light text-goatzy-dark">{emailStats.sent}</p>
                <p className="text-xs text-gray-500 mt-1">Emails Sent</p>
              </div>
              <div className="bg-white p-4 border border-goatzy-pale rounded-xl text-center">
                <p className="text-3xl font-light text-goatzy">{emailStats.total > 0 ? ((emailStats.sent / emailStats.total) * 100).toFixed(0) : 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Send Rate</p>
              </div>
              <div className="bg-amber-50 p-4 border border-amber-200 rounded-xl text-center">
                <p className="text-3xl font-light text-amber-600">{emailStats.pending || 0}</p>
                <p className="text-xs text-amber-600 mt-1">Pending (5min+)</p>
              </div>
              <div className="bg-red-50 p-4 border border-red-200 rounded-xl text-center">
                <p className="text-3xl font-light text-red-600">{emailStats.failed}</p>
                <p className="text-xs text-red-500 mt-1">Failed</p>
              </div>
            </div>

            {/* Recent Email Logs */}
            {emailLogs.length > 0 && (
              <div className="bg-white border border-goatzy-pale rounded-xl overflow-hidden">
                <div className="px-6 py-3 border-b border-goatzy-pale">
                  <h3 className="text-sm font-light tracking-wide text-gray-600">Recent Email Logs</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-goatzy-pale bg-goatzy-bg">
                        <th className="px-4 py-2 text-left text-xs font-light tracking-wide text-gray-600">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-light tracking-wide text-gray-600">Product</th>
                        <th className="px-4 py-2 text-center text-xs font-light tracking-wide text-gray-600">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-light tracking-wide text-gray-600">Resend ID</th>
                        <th className="px-4 py-2 text-left text-xs font-light tracking-wide text-gray-600">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-goatzy-bg">
                          <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-700">{log.product_slug}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-light ${
                              log.status === 'sent' ? 'bg-green-100 text-green-700' :
                              log.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500 font-mono">{log.resend_id || '-'}</td>
                          <td className="px-4 py-2 text-xs text-red-500 max-w-xs truncate">{log.error_message || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Verification */}
        <div className="mb-12">
          <div className="bg-white p-6 border border-goatzy-pale rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light tracking-wide text-goatzy-dark">Review Verification</h2>
              <label className="px-6 py-2 bg-goatzy-dark text-white text-sm font-light tracking-wide rounded-lg cursor-pointer hover:bg-goatzy transition-all duration-300">
                Upload Amazon Reviews (CSV/XLSX)
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {!amazonReviews && (
              <p className="text-sm text-gray-500 font-light">
                Upload a CSV or XLSX file with Amazon reviews (SellerSprite or similar) to verify which customers actually submitted their review.
              </p>
            )}

            {amazonReviews && reviewMatches && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 border border-goatzy-pale rounded-lg text-center">
                    <p className="text-2xl font-light text-goatzy-dark">{amazonReviews.length}</p>
                    <p className="text-xs text-gray-500">Amazon Reviews</p>
                  </div>
                  <div className="p-4 border border-goatzy-accent bg-goatzy-bg rounded-lg text-center">
                    <p className="text-2xl font-light text-goatzy">{reviewMatches.filter(m => m.status === 'confirmed').length}</p>
                    <p className="text-xs text-goatzy">Confirmed</p>
                  </div>
                  <div className="p-4 border border-amber-300 bg-amber-50 rounded-lg text-center">
                    <p className="text-2xl font-light text-amber-700">{reviewMatches.filter(m => m.status === 'probable').length}</p>
                    <p className="text-xs text-amber-600">Probable</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-2xl font-light text-gray-500">{reviewMatches.filter(m => m.status === 'not_found').length}</p>
                    <p className="text-xs text-gray-500">Not Found</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-goatzy-pale">
                        <th className="px-4 py-3 text-left text-xs font-light tracking-wide text-gray-600">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-light tracking-wide text-gray-600">Generated Review</th>
                        <th className="px-4 py-3 text-left text-xs font-light tracking-wide text-gray-600">Best Amazon Match</th>
                        <th className="px-4 py-3 text-center text-xs font-light tracking-wide text-gray-600">Score</th>
                        <th className="px-4 py-3 text-center text-xs font-light tracking-wide text-gray-600">Stars</th>
                        <th className="px-4 py-3 text-center text-xs font-light tracking-wide text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewMatches.map((match, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-goatzy-bg">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-goatzy-dark">{match.customer.first_name} {match.customer.last_name}</p>
                            <p className="text-xs text-gray-500">{match.customer.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-700 max-w-xs" title={match.customer.review_text}>
                              {match.customer.review_text.length > 120 ? match.customer.review_text.substring(0, 120) + '...' : match.customer.review_text}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{match.customer.review_stars} stars</p>
                          </td>
                          <td className="px-4 py-3">
                            {match.bestMatch ? (
                              <>
                                <p className="text-xs text-gray-700 max-w-xs" title={match.bestMatch.text}>
                                  {match.bestMatch.text.length > 120 ? match.bestMatch.text.substring(0, 120) + '...' : match.bestMatch.text}
                                </p>
                                {match.bestMatch.date && <p className="text-xs text-gray-400 mt-1">{match.bestMatch.date}</p>}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400 italic">No match</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center"><span className="text-sm font-light">{(match.score * 100).toFixed(0)}%</span></td>
                          <td className="px-4 py-3 text-center">
                            {match.starsMatch === true && <span className="text-goatzy text-sm">yes</span>}
                            {match.starsMatch === false && <span className="text-red-500 text-sm">no</span>}
                            {match.starsMatch === null && <span className="text-gray-400 text-sm">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {match.status === 'confirmed' && <span className="px-3 py-1 text-xs font-light bg-goatzy-pale text-goatzy-dark border border-goatzy-accent rounded-full">Confirmed</span>}
                            {match.status === 'probable' && <span className="px-3 py-1 text-xs font-light bg-amber-100 text-amber-800 border border-amber-300 rounded-full">Probable</span>}
                            {match.status === 'not_found' && <span className="px-3 py-1 text-xs font-light bg-gray-100 text-gray-600 border border-gray-300 rounded-full">Not Found</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white border border-goatzy-pale rounded-xl overflow-hidden">
          <div className="p-6 border-b border-goatzy-pale">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-light tracking-wide text-goatzy-dark">Customer List</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {customers.length} total customer{customers.length !== 1 ? 's' : ''}
                  {selectedCustomers.length > 0 && (
                    <span className="ml-2 text-goatzy font-medium">
                      ({selectedCustomers.length} selected)
                    </span>
                  )}
                </p>
              </div>
              {selectedCustomers.length > 0 && (
                <button
                  onClick={deleteSelectedCustomers}
                  className="px-6 py-2 bg-red-600 text-white text-sm font-light tracking-wide rounded-lg
                           hover:bg-red-700 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                >
                  Delete ({selectedCustomers.length})
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-goatzy-bg border-b border-goatzy-pale">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={toggleAllCustomers}
                      className="h-4 w-4 border-gray-300 focus:ring-goatzy cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-light tracking-wider text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-light tracking-wider text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-light tracking-wider text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-light tracking-wider text-gray-700 uppercase">Review</th>
                  <th className="px-6 py-3 text-left text-xs font-light tracking-wider text-gray-700 uppercase">Amazon</th>
                  <th className="px-6 py-3 text-left text-xs font-light tracking-wider text-gray-700 uppercase">Gifts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-goatzy-pale">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-goatzy-bg cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="h-4 w-4 border-gray-300 focus:ring-goatzy cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-light text-goatzy-dark">{customer.first_name} {customer.last_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{new Date(customer.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.review_generated ? (
                        <span className="text-sm">{customer.review_stars} stars - {customer.review_tone}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.went_to_amazon ? (
                        <span className="text-sm text-goatzy">Yes</span>
                      ) : (
                        <span className="text-sm text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.claimed_gifts ? (
                        <span className="text-sm text-goatzy">Yes</span>
                      ) : (
                        <span className="text-sm text-gray-400">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="p-6 border-b border-goatzy-pale flex justify-between items-center">
              <h3 className="text-2xl font-light tracking-wide text-goatzy-dark">Customer Details</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-goatzy-dark transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-light tracking-wide text-gray-600 mb-2">Customer Information</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-light text-gray-600">Name:</span> {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                  <p className="text-sm"><span className="font-light text-gray-600">Email:</span> {selectedCustomer.email}</p>
                  <p className="text-sm"><span className="font-light text-gray-600">Submitted:</span> {new Date(selectedCustomer.created_at).toLocaleString()}</p>
                  <p className="text-sm"><span className="font-light text-gray-600">Opted in for surveys:</span> {selectedCustomer.opt_in_surveys ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selectedCustomer.review_generated && (
                <div>
                  <h4 className="text-sm font-light tracking-wide text-gray-600 mb-2">Review Details</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-light text-gray-600">Rating:</span> {selectedCustomer.review_stars} stars</p>
                    <p className="text-sm"><span className="font-light text-gray-600">Tone:</span> {selectedCustomer.review_tone}</p>
                    {selectedCustomer.review_text && (
                      <div>
                        <p className="text-sm font-light text-gray-600 mb-2">Generated Review:</p>
                        <div className="bg-goatzy-bg p-4 border border-goatzy-pale rounded-lg">
                          <p className="text-sm leading-relaxed">{selectedCustomer.review_text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-light tracking-wide text-gray-600 mb-2">Journey Status</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-light text-gray-600">Generated Review:</span> {selectedCustomer.review_generated ? 'Yes' : 'No'}</p>
                  <p className="text-sm"><span className="font-light text-gray-600">Went to Amazon:</span> {selectedCustomer.went_to_amazon ? 'Yes' : 'No'}</p>
                  <p className="text-sm"><span className="font-light text-gray-600">Claimed Gifts:</span> {selectedCustomer.claimed_gifts ? 'Yes' : 'No'}</p>
                  <p className="text-sm"><span className="font-light text-gray-600">Email Sent:</span> {selectedCustomer.email_sent ? 'Yes' : 'No'}{selectedCustomer.email_sent_at ? ` (${new Date(selectedCustomer.email_sent_at).toLocaleString()})` : ''}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-goatzy-pale">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full px-6 py-3 bg-goatzy-dark text-white font-light tracking-wide rounded-lg
                         hover:bg-goatzy transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
