import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { fetchProductConfig } from '../utils/config';

/**
 * DownloadPage - Goatzy US Campaign
 * Branded download page for ebooks. Linked from email.
 * URL: /download/:customerId
 */
const DownloadPage = () => {
  const { customerId } = useParams();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [firstName, setFirstName] = useState('');
  const [productName, setProductName] = useState('');
  const [ebooks, setEbooks] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!customerId || !supabase) {
      setStatus('error');
      return;
    }

    const loadData = async () => {
      try {
        const { data: customer, error: customerErr } = await supabase
          .from('customer_submissions')
          .select('first_name, product_slug')
          .eq('id', customerId)
          .single();

        if (customerErr || !customer) {
          setStatus('error');
          return;
        }

        setFirstName(customer.first_name || '');

        const config = await fetchProductConfig(customer.product_slug);
        setProductName(config?.name || customer.product_slug);

        let ebookList = [];
        if (Array.isArray(config?.ebooks) && config.ebooks.length > 0) {
          ebookList = config.ebooks;
        } else if (config?.ebook_url) {
          const url = config.ebook_url;
          const rawName = decodeURIComponent(url.split('/').pop() || 'Ebook.pdf');
          ebookList = [{ name: rawName.replace(/\.pdf$/i, ''), url }];
        }

        setEbooks(ebookList);
        setStatus('ready');
      } catch (err) {
        console.error('DownloadPage error:', err);
        setStatus('error');
      }
    };

    loadData();
  }, [customerId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-goatzy-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-goatzy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-goatzy-dark font-light">Loading your downloads…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-goatzy-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-light text-goatzy-dark mb-3">Link not found</h1>
          <p className="text-gray-500 font-light">
            This download link is invalid or has expired. Please check your email or contact us at{' '}
            <a href="mailto:hello@goatzy.com" className="text-goatzy underline">hello@goatzy.com</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-goatzy-bg">
      {/* Header */}
      <div className="bg-goatzy-dark py-8 px-6 text-center">
        <h1 className="text-white text-3xl font-light tracking-widest">GOATZY</h1>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="animate-fade-in">
          <h2 className="text-2xl font-light text-goatzy-dark mb-2">
            Hi {firstName}, your downloads are ready!
          </h2>
          <p className="text-gray-500 font-light mb-8">
            Thank you for your purchase of the <strong className="text-goatzy-dark font-normal">{productName}</strong>.
            Click the buttons below to download your files.
          </p>

          {ebooks.length === 0 ? (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-400 font-light">
              No downloads available yet. Please contact us if you believe this is an error.
            </div>
          ) : (
            <div className="space-y-4">
              {ebooks.map((ebook, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-goatzy-pale rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-goatzy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-goatzy-dark font-normal text-sm">{ebook.name}</p>
                      <p className="text-gray-400 text-xs font-light">PDF Document</p>
                    </div>
                  </div>

                  <a
                    href={ebook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center gap-2 bg-goatzy-dark text-white text-sm font-light px-4 py-2 rounded-lg hover:bg-goatzy transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-12 px-6">
        <p className="text-goatzy-dark text-sm font-light italic">Designed by breeders, made for breeders.</p>
        <p className="text-gray-400 text-xs font-light mt-1">— Team Goatzy</p>
      </div>
    </div>
  );
};

export default DownloadPage;
