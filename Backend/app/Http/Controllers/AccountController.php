<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AccountController extends Controller {
    protected $supabase;

    public function __construct(SupabaseService $supabase) {
        $this->supabase = $supabase;
    }

    public function index() {
        $accounts = $this->supabase->getAll();
        
        // If $accounts is an object, convert to array
        if (is_object($accounts)) {
            $accounts = (array) $accounts;
        }

        return response()->json($accounts);
    }

    public function store(Request $request) {
        return response()->json(
            $this->supabase->insert($request->only(['first_name', 'last_name', 'email']))
        );
    }

    public function update(Request $request, $id) {
        return response()->json(
            $this->supabase->update($id, $request->only(['first_name', 'last_name','email']))
        );
    }

    public function destroy($id)
    {
        $url = env('SUPABASE_URL') . '/auth/v1/admin/users/' . $id;
        \Log::info('Deleting user at URL: ' . $url);

        $response = Http::withHeaders([
            'apikey' => env('SUPABASE_KEY'),
            'Authorization' => 'Bearer ' . env('SUPABASE_KEY'),
            'Content-Type' => 'application/json',
        ])->delete($url);

        \Log::info('Response status: ' . $response->status());
        \Log::info('Response body: ' . $response->body());

        if ($response->successful()) {
            return response()->json(['message' => 'User deleted successfully']);
        } else {
            return response()->json(['message' => 'Failed to delete user', 'error' => $response->body()], 500);
        }
    }
}
