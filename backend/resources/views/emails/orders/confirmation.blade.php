
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo de compra — AgroConecta</title>
    <style>
        body, table, td, p, a, div, span { margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; }
        body { background:#f3f3f3; color:#111111; }
        table { border-collapse:collapse; }
        img { border:0; display:block; line-height:100%; }

        .wrapper { width:100%; background:#f3f3f3; padding:32px 0; }
        .container { width:100%; max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e7e7e7; border-radius:18px; }
        .inner { padding-left:32px; padding-right:32px; }
        .brand { text-align:center; padding:0 0 22px 0; font-size:16px; font-weight:700; color:#171717; }
        .brand .dot { color:#22c55e; font-size:18px; vertical-align:middle; }

        .hero { padding-top:36px; padding-bottom:28px; border-bottom:1px solid #efefef; }
        .icon-box {
            width:46px; height:46px; border-radius:12px; background:#eefbf2; border:1px solid #bde8c9;
            text-align:center; line-height:46px; font-size:22px; color:#16a34a; font-weight:bold;
        }
        .eyebrow { padding-top:18px; font-size:11px; line-height:16px; font-weight:700; letter-spacing:1.4px; color:#16a34a; text-transform:uppercase; }
        .title { padding-top:10px; font-size:24px; line-height:30px; font-weight:700; color:#111111; letter-spacing:-0.4px; }
        .subtitle { padding-top:12px; font-size:16px; line-height:25px; color:#6b7280; }
        .subtitle strong { color:#111111; }

        .meta-wrap { background:#fafafa; border-bottom:1px solid #efefef; }
        .meta-table { width:100%; }
        .meta-cell {
            width:33.33%; padding:18px 12px 18px 12px; vertical-align:top;
        }
        .meta-cell.border { border-left:1px solid #e5e5e5; }
        .meta-label { font-size:10px; line-height:14px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#a3a3a3; padding-bottom:6px; }
        .meta-value { font-size:14px; line-height:20px; font-weight:700; color:#111111; }
        .meta-value.green { color:#16a34a; }

        .items { padding-top:6px; padding-bottom:6px; }
        .item-row { border-bottom:1px solid #f3f3f3; }
        .item-cell { padding-top:16px; padding-bottom:16px; vertical-align:middle; }
        .thumb-cell { width:54px; }
        .thumb {
            width:44px; height:44px; border-radius:10px; overflow:hidden; background:#f4f4f4; border:1px solid #e5e5e5;
            text-align:center; line-height:44px; font-size:18px;
        }
        .item-name { font-size:14px; line-height:20px; font-weight:700; color:#111111; }
        .item-desc { font-size:12px; line-height:18px; color:#9ca3af; padding-top:2px; }
        .amount-cell { width:96px; text-align:right; font-size:14px; line-height:20px; font-weight:700; color:#111111; white-space:nowrap; }

        .totals-wrap { background:#fafafa; border-top:1px solid #efefef; padding-top:18px; padding-bottom:20px; }
        .totals-table { width:100%; }
        .totals-table td { font-size:13px; line-height:20px; color:#6b7280; padding:4px 0; }
        .totals-table .right { text-align:right; white-space:nowrap; color:#404040; font-weight:500; }
        .totals-table .free { color:#16a34a; font-weight:700; }
        .divider { border-top:1px solid #e5e5e5; height:1px; line-height:1px; font-size:1px; margin:12px 0; }
        .grand td { padding-top:2px; font-size:15px; line-height:22px; font-weight:700; color:#111111; }
        .grand .right { font-size:18px; line-height:24px; font-weight:700; color:#111111; }

        .cta-wrap { padding-top:24px; padding-bottom:24px; border-top:1px solid #f1f1f1; }
        .btn {
            display:block; width:100%; background:#0a0a0a; color:#ffffff !important; text-decoration:none; text-align:center;
            font-size:14px; line-height:20px; font-weight:700; padding:15px 16px; border-radius:10px;
        }

        .footer { border-top:1px solid #f3f3f3; padding-top:20px; padding-bottom:28px; text-align:center; }
        .footer p { font-size:12px; line-height:20px; color:#a3a3a3; }
        .footer a { color:#5f5f5f; text-decoration:underline; }
        .bottom-note { text-align:center; padding-top:20px; font-size:11px; line-height:18px; color:#a3a3a3; }

        @media only screen and (max-width:600px) {
            .inner { padding-left:20px !important; padding-right:20px !important; }
            .hero { padding-top:28px !important; }
            .title { font-size:22px !important; line-height:28px !important; }
            .amount-cell { width:84px !important; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="brand"><span class="dot">•</span> AgroConecta</div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="container">
            <tr>
                <td class="inner hero">
                    <div class="icon-box">✓</div>
                    <div class="eyebrow">Pago confirmado</div>
                    <div class="title">Tu pedido está<br>en camino.</div>
                    <div class="subtitle">Hola, <strong>{{ $pedido->buyer->name ?? 'Cliente' }}</strong>. Hemos recibido tu compra y ya está siendo preparada por el agricultor.</div>
                </td>
            </tr>

            <tr>
                <td class="meta-wrap inner">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="meta-table">
                        <tr>
                            <td class="meta-cell" style="padding-left:0;">
                                <div class="meta-label">Pedido</div>
                                <div class="meta-value">#{{ $pedido->prefixed_id }}</div>
                            </td>
                            <td class="meta-cell border">
                                <div class="meta-label">Fecha</div>
                                <div class="meta-value">{{ $pedido->created_at->format('d M Y') }}</div>
                            </td>
                            <td class="meta-cell border" style="padding-right:0;">
                                <div class="meta-label">Estado</div>
                                <div class="meta-value" style="color:#d97706;">Pendiente</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td class="inner items">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        @foreach($pedido->items as $item)
                        <tr class="item-row">
                            <td class="item-cell thumb-cell">
                                @php $imagePath = $item->product->images->first()?->image_path; @endphp
                                <div class="thumb">
                                    @if($imagePath)
                                        <img src="{{ \App\Mail\ReciboCompra::embedImage($message, $imagePath) }}" alt="{{ $item->product->name }}" width="44" height="44" style="width:44px;height:44px;object-fit:cover;display:block;">
                                    @else
                                        🌱
                                    @endif
                                </div>
                            </td>
                            <td class="item-cell">
                                <div class="item-name">{{ $item->product->name }}</div>
                                <div class="item-desc">{{ $item->quantity }} {{ $item->product->unit ?? 'uds' }} &times; {{ number_format($item->price, 2) }}€</div>
                            </td>
                            <td class="item-cell amount-cell">{{ number_format($item->subtotal, 2) }}€</td>
                        </tr>
                        @endforeach
                    </table>
                </td>
            </tr>

            <tr>
                <td class="totals-wrap inner">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="totals-table">
                        <tr>
                            <td>Subtotal</td>
                            <td class="right">{{ number_format($pedido->total, 2) }}€</td>
                        </tr>
                        <tr>
                            <td>Envío local</td>
                            <td class="right free">Gratis</td>
                        </tr>
                    </table>
                    <div class="divider">&nbsp;</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="totals-table grand">
                        <tr>
                            <td>Total</td>
                            <td class="right">{{ number_format($pedido->total, 2) }}€</td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td class="inner cta-wrap">
                    <a href="{{ rtrim(env('FRONTEND_URL', 'http://localhost:4200'), '/') }}/dashboard" class="btn">Seguimiento del pedido →</a>
                </td>
            </tr>

            <tr>
                <td class="inner footer">
                    <p>¿Tienes alguna pregunta? <a href="mailto:soporte@agroconecta.store">soporte@agroconecta.store</a><br>
                    AgroConecta &copy; {{ date('Y') }} — Apoyando a los agricultores.</p>
                </td>
            </tr>
        </table>

        <div class="bottom-note">Has recibido este correo por realizar una compra en AgroConecta.</div>
    </div>
</body>
</html>