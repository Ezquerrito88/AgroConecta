<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\AzureBlobStorage\AzureBlobStorageAdapter;
use League\Flysystem\Filesystem;
use MicrosoftAzure\Storage\Blob\BlobRestProxy;
use App\Models\Conversation;
use App\Policies\ConversationPolicy;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Conversation::class, ConversationPolicy::class);

        Storage::extend('azure', function ($app, $config) {
            $client = BlobRestProxy::createBlobService(
                'DefaultEndpointsProtocol=https;AccountName=' . $config['name'] .
                ';AccountKey=' . $config['key'] .
                ';EndpointSuffix=core.windows.net'
            );
            $adapter = new AzureBlobStorageAdapter($client, $config['container']);
            return new \Illuminate\Filesystem\FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });
    }
}
