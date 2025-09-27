<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class SupabaseService {
    protected $url;
    protected $key;
    protected $table;

    public function __construct() {
        $this->url = env('SUPABASE_URL') . '/rest/v1/';
        $this->key = env('SUPABASE_KEY');
        $this->table = env('SUPABASE_TABLE', 'profiles');
    }

    private function client() {
        return Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => "Bearer {$this->key}",
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation' // ✅ force Supabase to return updated rows
        ]);
    }
    // CREATE
    public function insert($data) {
        return $this->client()
            ->post($this->url . $this->table, $data)
            ->json();
    }

    // READ
    public function getAll() {
        return $this->client()
            ->get($this->url . $this->table)
            ->json();
    }

    // UPDATE
    public function update($id, $data) {
        return $this->client()
            ->patch($this->url . $this->table . "?id=eq.$id", $data)
            ->json();
    }

    // DELETE
    public function delete($id) {
        return $this->client()
            ->delete($this->url . $this->table . "?id=eq.$id")
            ->json();
    }
}