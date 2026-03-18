<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Conversation $conversation): bool
    {
        return $user->id === $conversation->buyer_id 
            || $user->id === $conversation->farmer_id;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Conversation $conversation): bool
    {
        return false;
    }

    public function delete(User $user, Conversation $conversation): bool
    {
        return false;
    }

    public function restore(User $user, Conversation $conversation): bool
    {
        return false;
    }

    public function forceDelete(User $user, Conversation $conversation): bool
    {
        return false;
    }
}
