<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Has realizado una venta! — AgroConecta</title>
    <style>
        body, table, td, p, a, div, span { margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; }
        body { background:#f3f3f3; color:#111111; }
        table { border-collapse:collapse; }
        img { border:0; display:block; line-height:100%; }

        .wrapper { width:100%; background:#f3f3f3; padding:32px 0; }
        .container { width:100%; max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e7e7e7; border-radius:18px; overflow:hidden; }
        .inner { padding-left:32px; padding-right:32px; }
        .brand { text-align:center; padding-bottom:22px; font-size:16px; font-weight:700; color:#171717; }
        .brand .dot { color:#22c55e; font-size:18px; }

        .hero { padding-top:36px; padding-bottom:28px; border-bottom:1px solid #efefef; }
        .icon-box {
            width:46px; height:46px; border-radius:12px;
            background:#fefce8; border:1px solid #fde68a;
            text-align:center; line-height:46px; font-size:22px;
        }
        .eyebrow { padding-top:18px; font-size:11px; font-weight:700; letter-spacing:1.4px; color:#d97706; text-transform:uppercase; }
        .title { padding-top:10px; font-size:24px; line-height:30px; font-weight:700; color:#111111; letter-spacing:-0.4px; }
        .subtitle { padding-top:12px; font-size:15px; line-height:24px; color:#6b7280; }
        .subtitle strong { color:#111111; }

        .amount-box {
            margin-top:20px; margin-bottom:4px;
            background:#f0fdf4; border:1px solid #bbf7d0;
            border-radius:12px; padding:18px 20px;
            display:inline-block; width:100%;
        }
        .amount-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#16a34a; padding-bottom:6px; }
        .amount-value { font-size:32px; font-weight:700; color:#111111; letter-spacing:-1px; }
        .amount-value span { font-size:18px; font-weight:600; color:#6b7280; }

        .meta-wrap { background:#fafafa; border-bottom:1px solid #efefef; }
        .meta-table { width:100%; }
        .meta-cell { width:33.33%; padding:16px 12px; vertical-align:top; }
        .meta-cell.border { border-left:1px solid #e5e5e5; }
        .meta-label { font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#a3a3a3; padding-bottom:5px; }
        .meta-value { font-size:14px; font-weight:700; color:#111111; }

        .items-title { padding-top:22px; padding-bottom:10px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#a3a3a3; }
        .items { padding-bottom:8px; }
        .item-row { border-bottom:1px solid #f3f3f3; }
        .item-cell { padding-top:14px; padding-bottom:14px; vertical-align:middle; }
        .thumb-cell { width:54px; }
        .thumb {
            width:44px; height:44px; border-radius:10px; overflow:hidden;
            background:#f4f4f4; border:1px solid #e5e5e5;
            text-align:center; line-height:44px; font-size:18px;
        }
        .item-name { font-size:14px; font-weight:700; color:#111111; }
        .item-desc { font-size:12px; color:#9ca3af; padding-top:2px; }
        .amount-cell { width:96px; text-align:right; font-size:14px; font-weight:700; color:#111111; white-space:nowrap; }

        .buyer-box {
            background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;
            padding:18px 20px; margin-top:4px;
        }
        .buyer-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#a3a3a3; padding-bottom:12px; }
        .buyer-row { padding:3px 0; font-size:13px; color:#6b7280; }
        .buyer-row strong { color:#111111; font-weight:600; }

        .totals-wrap { background:#fafafa; border-top:1px solid #efefef; padding-top:18px; padding-bottom:20px; }
        .totals-table { width:100%; }
        .totals-table td { font-size:13px; line-height:20px; color:#6b7280; padding:4px 0; }
        .totals-table .right { text-align:right; white-space:nowrap; color:#404040; font-weight:500; }
        .divider { border-top:1px solid #e5e5e5; height:1px; line-height:1px; font-size:1px; margin:12px 0; }
        .grand td { font-size:15px; font-weight:700; color:#111111; padding-top:2px; }
        .grand .right { font-size:18px; letter-spacing:-0.4px; }

        .cta-wrap { padding-top:24px; padding-bottom:24px; border-top:1px solid #f1f1f1; }
        .btn-dark {
            display:block; width:100%; background:#0a0a0a; color:#ffffff !important;
            text-decoration:none; text-align:center; font-size:14px; font-weight:700;
            padding:15px 16px; border-radius:10px;
        }

        .footer { border-top:1px solid #f3f3f3; padding-top:20px; padding-bottom:28px; text-align:center; }
        .footer p { font-size:12px; line-height:20px; color:#a3a3a3; }
        .footer a { color:#5f5f5f; text-decoration:underline; }
        .bottom-note { text-align:center; padding-top:20px; font-size:11px; line-height:18px; color:#a3a3a3; max-width:560px; margin:0 auto; }

        @media only screen and (max-width:600px) {
            .inner { padding-left:20px !important; padding-right:20px !important; }
            .title { font-size:22px !important; }
            .amount-value { font-size:26px !important; }
        }
    </style>
</head>
<body>
<div class="wrapper">

    <div class="brand"><span class="dot">•</span> AgroConecta</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
        <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="container">

            <tr>
                <td class="inner hero">
                    <div class="icon-box">💰</div>
                    <div class="eyebrow">¡Nueva venta!</div>
                    <h1 class="title">Tienes una venta,<br>{{ $pedido->seller->name ?? 'Agricultor' }}.</h1>
                    <p class="subtitle">Un comprador ha adquirido tus productos. Te avisamos para que prepares el pedido lo antes posible.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td class="amount-box">
                                <div class="amount-label">Ingreso recibido</div>
                                <div class="amount-value">{{ number_format($pedido->total, 2) }}<span> €</span></div>
                            </td>
                        </tr>
                    </table>
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
                <td class="inner">
                    <div class="items-title">Productos vendidos</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="items">
                        @foreach($pedido->items as $item)
                        <tr class="item-row">
                            <td class="item-cell thumb-cell">
                                @php $imagePath = $item->product->images->first()?->image_path; @endphp
                                <div class="thumb">
                                    @if($imagePath)
                                        <img src="{{ \App\Mail\ReciboCompra::embedImage($message, $imagePath) }}" alt="{{ $item->product->name }}" width="44" height="44" style="width:44px;height:44px;object-fit:cover;border-radius:10px;">
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
                <td class="inner" style="padding-bottom:28px; border-bottom:1px solid #f0f0f0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td class="buyer-box">
                                <div class="buyer-title">Datos del comprador</div>
                                <div class="buyer-row"><strong>Nombre:</strong> {{ $pedido->buyer->name ?? '—' }}</div>
                                <div class="buyer-row"><strong>Email:</strong> {{ $pedido->buyer->email ?? '—' }}</div>
                                @if($pedido->shipping_address)
                                <div class="buyer-row"><strong>Dirección:</strong> {{ $pedido->shipping_address }}</div>
                                @endif
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td class="totals-wrap inner">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="totals-table">
                        <tr>
                            <td>Subtotal productos</td>
                            <td class="right">{{ number_format($pedido->total, 2) }}€</td>
                        </tr>
                        <tr>
                            <td>Comisión plataforma</td>
                            <td class="right">0.00€</td>
                        </tr>
                    </table>
                    <div class="divider">&nbsp;</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="totals-table grand">
                        <tr>
                            <td>Total a recibir</td>
                            <td class="right">{{ number_format($pedido->total, 2) }}€</td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td class="inner cta-wrap">
                    <a href="{{ rtrim(env('FRONTEND_URL', 'http://localhost:4200'), '/') }}/dashboard" class="btn-dark">Ver pedido en mi panel →</a>
                </td>
            </tr>

            <tr>
                <td class="inner footer">
                    <p>¿Alguna duda? <a href="mailto:soporte@agroconecta.store">soporte@agroconecta.store</a><br>
                    AgroConecta &copy; {{ date('Y') }} — Apoyando a los agricultores.</p>
                </td>
            </tr>

        </table>
        </td></tr>
    </table>

    <div class="bottom-note">Has recibido este correo porque tienes una cuenta de agricultor en AgroConecta.</div>

</div>
</body>
</html>