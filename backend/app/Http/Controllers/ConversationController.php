<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConversationController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;

        $conversations = Conversation::with(['buyer', 'farmer', 'lastMessage'])
            ->where('buyer_id', $userId)
            ->orWhere('farmer_id', $userId)
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($conversations);
    }

    public function store(Request $request)
    {
        $request->validate(['farmer_id' => 'required|exists:users,id']);
        $user = Auth::user();

        $conversation = Conversation::firstOrCreate([
            'buyer_id'  => $user->id,
            'farmer_id' => $request->farmer_id,
        ]);

        return response()->json($conversation, 201);
    }

    public function messages($id)
    {
        $user = Auth::user();

        $conversation = Conversation::findOrFail($id);
        $this->authorize('view', $conversation);

        $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', 0)
            ->update(['is_read' => 1]);

        return response()->json($conversation->messages()->with('sender')->get());
    }

    public function sendMessage(Request $request, $id)
    {
        $request->validate(['content' => 'required|string|max:2000']);

        $user = Auth::user();

        $conversation = Conversation::findOrFail($id);
        $this->authorize('view', $conversation);

        $message = $conversation->messages()->create([
            'sender_id'      => $user->id,
            'content'        => $request->content,
            'attachment_url' => $request->attachment_url ?? null,
        ]);

        $conversation->touch();

        return response()->json($message->load('sender'), 201);
    }
}
