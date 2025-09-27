<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
public function destroy($id)
{
    \Log::info("Deleting user: $id");
    // find local user
    $user = \App\Models\User::find($id);

    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }

    $supabaseUserId = $user->supabase_user_id;

    if (!$supabaseUserId) {
        return response()->json(['error' => 'Supabase user ID not found'], 400);
    }

    // delete from Supabase Auth
    $url = env('SUPABASE_URL') . "/auth/v1/admin/users/{$supabaseUserId}";

    $response = Http::withHeaders([
        'apikey' => env('SUPABASE_SERVICE_ROLE_KEY'),
        'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_ROLE_KEY'),
    ])->delete($url);

    if ($response->failed()) {
        return response()->json([
            'error' => 'Failed to delete user from Supabase',
            'details' => $response->json()
        ], 500);
    }

    // delete local record
    $user->delete();

    return response()->json(['message' => 'Account deleted successfully']);
}
}
