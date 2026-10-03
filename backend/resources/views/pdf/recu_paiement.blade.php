<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; color: #1a1a2e; background: #fff; font-size: 12px; }

    .header { background: #1E3A5F; color: white; padding: 22px 35px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .logo-area h1 { font-size: 20px; font-weight: 900; letter-spacing: 1px; }
    .logo-area p { font-size: 10px; opacity: 0.8; margin-top: 2px; }
    .recu-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 8px 15px; text-align: right; }
    .recu-badge .label { font-size: 9px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
    .recu-badge .numero { font-size: 17px; font-weight: 900; margin-top: 2px; }
    .header-bottom { margin-top: 12px; font-size: 10px; opacity: 0.75; }
    .header-bottom span { margin-right: 20px; }

    .body { padding: 18px 35px; }

    .status-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; }
    .status-text { color: #166534; font-weight: 700; font-size: 12px; }
    .status-sub { color: #16a34a; font-size: 10px; margin-top: 1px; }

    .grid-2 { display: flex; gap: 16px; margin-bottom: 16px; }
    .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
    .card-title { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; font-weight: 700; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
    .card-name { font-size: 14px; font-weight: 900; color: #1E3A5F; margin-bottom: 6px; }
    .card-line { font-size: 11px; color: #6b7280; margin-bottom: 3px; }
    .card-line span { color: #374151; font-weight: 600; }

    .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .detail-table thead tr { background: #1E3A5F; color: white; }
    .detail-table thead th { padding: 8px 14px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-table tbody tr { border-bottom: 1px solid #f3f4f6; }
    .detail-table tbody tr:nth-child(even) { background: #f9fafb; }
    .detail-table tbody td { padding: 9px 14px; font-size: 11px; color: #374151; }
    .detail-table tbody td.amount { font-weight: 700; color: #1E3A5F; }

    .total-box { background: #1E3A5F; color: white; border-radius: 8px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; }
    .total-label { font-size: 11px; opacity: 0.8; }
    .total-amount { font-size: 22px; font-weight: 900; }
    .total-currency { font-size: 13px; opacity: 0.8; margin-left: 4px; }

    .footer { border-top: 2px solid #1E3A5F; padding: 12px 35px; display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
    .footer-left { font-size: 10px; color: #6b7280; line-height: 1.6; }
    .footer-right { font-size: 10px; color: #6b7280; text-align: right; line-height: 1.6; }
    .stamp { border: 3px solid #22c55e; border-radius: 50%; width: 60px; height: 60px; text-align: center; color: #16a34a; font-size: 11px; font-weight: 900; text-transform: uppercase; line-height: 1.4; transform: rotate(-15deg); padding-top: 12px; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="logo-area">
        <h1>VIP SPORT CENTER</h1>
        <p>Your wellness &amp; performance partner</p>
      </div>
      <div class="recu-badge">
        <div class="label">Payment receipt</div>
        <div class="numero">{{ $numero }}</div>
      </div>
    </div>
    <div class="header-bottom">
      <span>Date: {{ $date }}</span>
      <span>Membership #{{ $cotisation->id }}</span>
      <span>Payment of {{ \Carbon\Carbon::parse($paiement->date_paiement)->format('d/m/Y') }}</span>
    </div>
  </div>

  <div class="body">

    <!-- STATUS -->
    <div class="status-banner">
      <div class="status-text">Payment confirmed</div>
      <div class="status-sub">This receipt certifies the payment made</div>
    </div>

    <!-- CLIENT + COACH -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Client</div>
        <div class="card-name">{{ $client->prenom }} {{ $client->nom }}</div>
        @if($client->telephone)
          <div class="card-line">Phone: <span>{{ $client->telephone }}</span></div>
        @endif
        @if($client->user && $client->user->email)
          <div class="card-line">Email: <span>{{ $client->user->email }}</span></div>
        @endif
        <div class="card-line">Joined on: <span>{{ \Carbon\Carbon::parse($client->date_inscription)->format('d/m/Y') }}</span></div>
      </div>
      <div class="card">
        <div class="card-title">Assigned coach</div>
        @if($coach)
          <div class="card-name">{{ $coach->prenom }} {{ $coach->nom }}</div>
          @if($coach->specialite)
            <div class="card-line">Specialty: <span>{{ $coach->specialite }}</span></div>
          @endif
          @if($coach->telephone)
            <div class="card-line">Phone: <span>{{ $coach->telephone }}</span></div>
          @endif
        @else
          <div class="card-line" style="color:#9ca3af;">No coach assigned</div>
        @endif
      </div>
    </div>

    <!-- PAYMENT DETAILS -->
    <table class="detail-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Period</th>
          <th>Due date</th>
          <th>Status</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Annual membership — {{ $cotisation->annee }}</td>
          <td>Installment no. {{ $paiement->echeance->numero ?? '—' }}</td>
          <td>{{ \Carbon\Carbon::parse($paiement->echeance->date_echeance)->format('d/m/Y') }}</td>
          <td>
            <span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;">
              Paid
            </span>
          </td>
          <td class="amount">{{ number_format($paiement->montant, 2) }} MAD</td>
        </tr>
      </tbody>
    </table>

    <!-- TOTAL -->
    <div class="total-box">
      <div>
        <div class="total-label">Total amount settled</div>
        <div style="font-size:10px;opacity:0.6;margin-top:2px;">VAT not applicable</div>
      </div>
      <div>
        <span class="total-amount">{{ number_format($paiement->montant, 2) }}</span>
        <span class="total-currency">MAD</span>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-left">
      <strong>VIP Sport Center</strong><br>
      Casablanca, Morocco<br>
      contact@sportcenter.ma
    </div>
    <div class="stamp">PAID<br>V</div>
    <div class="footer-right">
      Generated on {{ $date }}<br>
      {{ $numero }}<br>
      <span style="color:#9ca3af;">Official proof of payment</span>
    </div>
  </div>

</body>
</html>
