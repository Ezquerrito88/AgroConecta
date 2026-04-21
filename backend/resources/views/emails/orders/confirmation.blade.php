<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <style>
        /* Estilos base para compatibilidad con Gmail y Outlook */
        body {
            margin: 0;
            padding: 0;
            background-color: #f6f9f6;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f6f9f6;
            padding-bottom: 40px;
        }

        .main {
            background-color: #ffffff;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border-spacing: 0;
            color: #444444;
            border-radius: 8px;
            overflow: hidden;
            margin-top: 20px;
        }

        /* Cabecera */
        .header {
            background-color: #2e7d32;
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: 1px;
        }

        /* Contenido */
        .content {
            padding: 30px 40px;
            line-height: 1.6;
        }

        .order-number {
            color: #888888;
            font-size: 14px;
            text-transform: uppercase;
            margin-bottom: 20px;
            font-weight: bold;
        }

        /* Tabla de Productos */
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .products-table th {
            text-align: left;
            border-bottom: 2px solid #f0f0f0;
            padding: 10px 0;
            color: #2e7d32;
        }

        .products-table td {
            padding: 15px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        /* Totales */
        .total-row td {
            padding-top: 20px;
            font-size: 18px;
            font-weight: bold;
            color: #2e7d32;
        }

        /* Botón */
        .button-container {
            text-align: center;
            padding: 30px 0;
        }

        .btn {
            background-color: #2e7d32;
            color: #ffffff !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
        }

        /* Footer */
        .footer {
            text-align: center;
            font-size: 12px;
            color: #999999;
            padding: 20px;
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <table class="main">
            <tr>
                <td class="header">
                    <h1>AGROCONECTA</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Directo del campo a tu mesa</p>
                </td>
            </tr>

            <tr>
                <td class="content">
                    <p class="order-number">Pedido #{{ $pedido->prefixed_id }}</p>
                    
                    <h2 style="margin-top: 0;">¡Hola, {{ $pedido->buyer->name ?? 'Cliente' }}!</h2>
                    <p>Tu pedido ha sido confirmado con éxito. Hemos avisado a nuestros agricultores para que comiencen a preparar tu envío con productos recién cosechados.</p>

                    <table class="products-table">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($pedido->items as $item)
                            <tr>
                                <td>{{ $item->quantity }}x {{ $item->product->name }}</td>
                                <td style="text-align: right;">{{ number_format($item->subtotal, 2) }}€</td>
                            </tr>
                            @endforeach
                            <tr class="total-row">
                                <td>TOTAL PAGADO</td>
                                <td style="text-align: right;">{{ number_format($pedido->total, 2) }}€</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #2e7d32;">📍 Próximos pasos</h4>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                            <li>El agricultor valida la disponibilidad de los productos.</li>
                            <li>Recibirás un nuevo correo cuando el pedido esté de camino.</li>
                            <li>Podrás seguir el estado desde tu panel de usuario.</li>
                        </ul>
                    </div>

                    <div class="button-container">
                        <a href="{{ url('/buyer/orders') }}" class="btn">Gestionar mi Pedido</a>
                    </div>
                </td>
            </tr>
        </table>

        <table style="margin: 0 auto; width: 100%; max-width: 600px;">
            <tr>
                <td class="footer">
                    <p>Has recibido este correo porque realizaste una compra en agroconecta.store</p>
                    <p>Logroño, La Rioja, España</p>
                    <p>&copy; {{ date('Y') }} Agroconecta. Comercio local y sostenible.</p>
                </td>
            </tr>
        </table>
    </div>
</body>

</html>