/* =============================================================================
   IntegrateAI — Website v2 sample / demo data
   EVERYTHING HERE IS FICTIONAL. No real third-party brand names. No real client
   results. Account names, products and figures are invented and illustrative.
   The fictional roaster "Northwind Coffee Roasters" is an obviously-illustrative
   composite, not a real company — UI that shows it must include the
   "illustrative composite, not a real company" note.
   Consumed by app.js: IAA.initApprovalLoop / IAA.initDashboard.
   ========================================================================== */
(function (window) {
  'use strict';
  window.IAA_DEMO = window.IAA_DEMO || {};

  /* ---------------------------------------------------------------------------
     HERO — brand-NEUTRAL approval scenarios (generic business, universal hook).
     NOT coffee, NOT a named company. Used as a single card in the hero.
     --------------------------------------------------------------------------- */
  window.IAA_DEMO.heroScenarios = [
    {
      id: 'hero-invoice',
      app: 'IntegrateAI',
      appBadge: 'APP',
      time: '08:14',
      risk: 'amber',
      riskLabel: 'Needs your sign-off — money leaves the account',
      title: 'Approve payment of an overdue supplier invoice?',
      detail: 'A supplier invoice is three days overdue and within agreed terms. I have checked it against the matching purchase order and the goods-received note — both line up. Pay it now to avoid a late fee?',
      facts: ['£1,840.00', 'Matches PO #4471', 'Late fee avoided: £92'],
      confirm: 'Done — £1,840.00 scheduled to the supplier for today, reference logged against PO #4471. I have noted the late fee was avoided.'
    }
  ];

  /* A single brand-neutral margin-alert scenario, useful as a second hero option
     or a low-risk example elsewhere. */
  window.IAA_DEMO.heroAltScenario = {
    id: 'hero-margin',
    app: 'IntegrateAI',
    appBadge: 'APP',
    time: '07:02',
    risk: 'green',
    riskLabel: 'Low risk — heads-up, no action taken yet',
    title: 'Margin on your best-selling line slipped this week',
    detail: 'Your top product\'s gross margin fell from 62% to 54% over the last seven days — input costs rose and the price held. Want me to draft a small price adjustment for you to review?',
    facts: ['Margin 62% → 54%', 'Top-selling line', 'Cause: input cost +9%'],
    confirm: 'Done — I\'ve drafted a revised price for your review and saved it as a proposal. Nothing changes until you approve it.'
  };

  /* ---------------------------------------------------------------------------
     FOOD & BEVERAGE — Northwind Coffee Roasters (FICTIONAL composite).
     6 approval scenarios spanning Green / Amber / Red, including ONE
     "request changes -> redraft -> auto-approve" micro-flow.
     --------------------------------------------------------------------------- */
  window.IAA_DEMO.northwindScenarios = [
    {
      id: 'nw-roast-idle',
      app: 'IntegrateAI', appBadge: 'APP', time: '06:48',
      risk: 'green',
      riskLabel: 'Low risk — efficiency suggestion',
      title: 'Your roaster sat idle for 90 minutes between batches yesterday',
      detail: 'Two wholesale roast runs were scheduled four hours apart with nothing in between. Grouping them saves gas and an hour of an operator\'s time. Shall I propose a tighter roast schedule for next week?',
      facts: ['~90 min idle', 'Saving: ~£38/run', 'No customer impact'],
      confirm: 'Done — I\'ve drafted a tighter roast schedule for next week and left it for your head roaster to confirm.'
    },
    {
      id: 'nw-wholesale-quiet',
      app: 'IntegrateAI', appBadge: 'APP', time: '07:15',
      risk: 'amber',
      riskLabel: 'Worth a look — a key account has gone quiet',
      title: 'The Bridge Café hasn\'t reordered in 5 weeks (usually every 2)',
      detail: 'The Bridge Café normally orders Harbour Blend every fortnight. Their last order was five weeks ago. That pattern usually means churn risk. Want me to draft a friendly check-in from your wholesale lead?',
      facts: ['Account: The Bridge Café', 'Usual cadence: 14 days', 'Now: 35 days'],
      confirm: 'Done — a warm check-in email is drafted and saved for your wholesale lead to send. I\'ve flagged the account to watch.'
    },
    {
      id: 'nw-reorder',
      app: 'IntegrateAI', appBadge: 'APP', time: '07:31',
      risk: 'amber',
      riskLabel: 'Needs your sign-off — places a green-coffee order',
      title: 'Green coffee stock for Old Town Espresso runs out in ~9 days',
      detail: 'At the current rate you\'ll be out of the base bean for Old Town Espresso in about nine days, and your supplier\'s lead time is seven. I can place a top-up order to bridge it. Approve?',
      facts: ['~9 days cover left', 'Lead time: 7 days', 'Order: 60kg · £660'],
      confirm: 'Done — 60kg green coffee ordered to bridge the gap, £660, arriving inside the lead time. Logged against Old Town Espresso.'
    },
    {
      id: 'nw-wholesale-redraft',
      app: 'IntegrateAI', appBadge: 'APP', time: '08:05',
      risk: 'amber',
      riskLabel: 'Needs your sign-off — outbound to a wholesale prospect',
      title: 'Draft outreach to Hartwell Provisions (new wholesale lead)',
      detail: 'Hartwell Provisions enquired about stocking your single origins. I\'ve drafted an intro offering a sample box of the Ethiopia and Colombia. Want to send as-is, or change it?',
      facts: ['New lead', 'Offer: sample box', 'Single origins'],
      confirm: 'Done — outreach sent to Hartwell Provisions with the sample-box offer. I\'ll watch for a reply and let you know.',
      redraft: {
        changesNote: 'Got it — making the offer warmer and adding a line about your wholesale terms. One moment…',
        redraftTitle: 'Revised outreach to Hartwell Provisions — warmer tone, terms added',
        redraftDetail: 'Updated: friendlier opening, a clear line on your wholesale pricing and minimum order, and the sample box of the Ethiopia and Colombia single origins. Ready to send?',
        redraftConfirm: 'Done — the revised outreach (warmer tone, wholesale terms included) is sent to Hartwell Provisions. I\'ll flag any reply.'
      }
    },
    {
      id: 'nw-price-change',
      app: 'IntegrateAI', appBadge: 'APP', time: '08:40',
      risk: 'red',
      riskLabel: 'High risk — changes a live wholesale price',
      title: 'Hold: a 6% wholesale price rise on Harbour Blend',
      detail: 'Green-coffee costs are up and Harbour Blend\'s wholesale margin has thinned. A 6% rise would restore it — but it touches every wholesale account, so I won\'t act without you. Review the proposal?',
      facts: ['Affects: all wholesale', 'Proposed: +6%', 'Restores margin to target'],
      confirm: 'Done — the 6% rise is staged with a customer-friendly note, ready to apply on your say-so. Nothing has changed yet.'
    },
    {
      id: 'nw-morning-brief',
      app: 'IntegrateAI', appBadge: 'APP', time: '06:30',
      risk: 'green',
      riskLabel: 'Low risk — your morning brief is ready',
      title: 'Morning brief: 1 account to watch, 1 reorder due, roaster on track',
      detail: 'Overnight I checked sales, stock and your wholesale accounts. The Bridge Café is quiet, Old Town Espresso needs a green-coffee top-up soon, and yesterday\'s roasts hit target. Open the full brief?',
      facts: ['1 churn signal', '1 reorder due', 'Roasts on target'],
      confirm: 'Done — the full morning brief is open in your thread. I\'ll bring you the next one tomorrow at 06:30.'
    }
  ];

  /* Convenience subset for the F&B page hero (single card opener). */
  window.IAA_DEMO.northwindHero = [window.IAA_DEMO.northwindScenarios[1]];

  /* ---------------------------------------------------------------------------
     NORTHWIND DASHBOARD — illustrative ONLY. Time axis = PROJECTION, not history.
     6 KPIs, channel-mix donut, wholesale-accounts table. Invented £ figures.
     --------------------------------------------------------------------------- */
  window.IAA_DEMO.northwindDashboard = {
    title: 'Northwind Coffee Roasters — sample dashboard (illustrative composite)',
    aria: 'Illustrative sample dashboard for a fictional coffee roaster. All figures invented; not a real client.',
    kpis: [
      { value: 18, prefix: '£', suffix: 'k', label: 'Monthly wholesale revenue', sub: 'illustrative' },
      { value: 34, suffix: '', label: 'Active wholesale accounts', sub: 'illustrative' },
      { value: 9, suffix: 'hrs', label: 'Roaster time saved / week', sub: 'projected' },
      { value: 6, prefix: '+', suffix: '%', label: 'Recovered gross margin', sub: 'projected' },
      { value: 2, suffix: '', label: 'Accounts flagged at risk', sub: 'this week' },
      { value: 11, suffix: '', label: 'Approvals cleared in Slack', sub: 'yesterday' }
    ],
    chart: {
      caption: 'Wholesale revenue — projected ramp',
      aria: 'Illustrative projected wholesale-revenue ramp from Month 1 to Month 6 for a fictional roaster. A projection, not real history.',
      yMax: 26,
      points: [
        { x: 'Month 1', y: 12 },
        { x: 'Month 2', y: 13.5 },
        { x: 'Month 3', y: 15 },
        { x: 'Month 4', y: 17 },
        { x: 'Month 5', y: 19.5 },
        { x: 'Month 6', y: 22 }
      ]
    },
    donut: {
      caption: 'Revenue by channel',
      aria: 'Illustrative channel mix: wholesale, café counter, online, and subscriptions.',
      segments: [
        { label: 'Wholesale', value: 48, colour: '#4A6FA5' },
        { label: 'Café counter', value: 27, colour: '#D97757' },
        { label: 'Online shop', value: 16, colour: '#4A7C59' },
        { label: 'Subscriptions', value: 9, colour: '#7B61A5' }
      ]
    },
    table: {
      caption: 'Wholesale accounts — illustrative',
      columns: ['Account', 'Product', 'Last order', 'Monthly value'],
      rows: [
        ['The Bridge Café', 'Harbour Blend', '35 days ago', '£640'],
        ['Hartwell Provisions', 'Ethiopia / Colombia', '4 days ago', '£910'],
        ['Meadowgate Foods', 'Harbour Blend', '9 days ago', '£1,480'],
        ['Selby & Crewe Deli', 'Old Town Espresso', '6 days ago', '£520'],
        ['Riverside Kitchen', 'Old Town Espresso', '12 days ago', '£760']
      ],
      trends: ['down', 'up', 'flat', 'up', 'down']
    }
  };

  /* ---------------------------------------------------------------------------
     CONNECT GRID — sample provider tiles (paste-a-key demo). Categories only;
     no real client credentials. The demo label is "Sample — no real credentials
     stored." (rendered by the page, not here).
     --------------------------------------------------------------------------- */
  window.IAA_DEMO.connectProviders = [
    { name: 'Accounting ledger', connected: true },
    { name: 'Online store', connected: true },
    { name: 'Card payments', connected: true },
    { name: 'Email & calendar', connected: false },
    { name: 'Social pages', connected: false },
    { name: 'Booking system', connected: false },
    { name: 'Stock & inventory', connected: false },
    { name: 'Email marketing', connected: false }
  ];

  /* ---------------------------------------------------------------------------
     ECONOMICS — per-role staffing costs as STATIC type (NO aggregated count-up).
     Illustrative external salary benchmark framing; "investment" not "price".
     --------------------------------------------------------------------------- */
  window.IAA_DEMO.economicsRoles = [
    { role: 'Marketing specialist', cost: '£38,000', note: 'typical UK salary' },
    { role: 'Operations analyst', cost: '£42,000', note: 'typical UK salary' },
    { role: 'Customer-service lead', cost: '£32,000', note: 'typical UK salary' },
    { role: 'Bookkeeper / finance', cost: '£35,000', note: 'typical UK salary' }
  ];

})(window);
