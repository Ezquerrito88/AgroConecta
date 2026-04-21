<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NuevaVenta extends Mailable
{
    use Queueable, SerializesModels;

    public $pedido;

    public function __construct($pedido)
    {
        $this->pedido = $pedido;
    }

    public static function embedImage($message, ?string $path): ?string
    {
        if (!$path) return '';
        if (filter_var($path, FILTER_VALIDATE_URL)) return $path;

        $disk = config('filesystems.default', 'public');

        if ($disk === 'azure') {
            $account   = config('filesystems.disks.azure.name');
            $container = config('filesystems.disks.azure.container');
            return "https://{$account}.blob.core.windows.net/{$container}/{$path}";
        }

        $localPath = storage_path('app/public/' . ltrim($path, '/'));
        if (file_exists($localPath)) {
            try {
                return $message->embed($localPath);
            } catch (\Exception $e) {
                return asset('storage/' . $path);
            }
        }

        return asset('storage/' . $path);
    }

    public function build()
    {
        return $this->subject('¡Enhorabuena, tienes un nuevo pedido en AgroConecta!')
                    ->view('emails.orders.nueva_venta');
    }
}
