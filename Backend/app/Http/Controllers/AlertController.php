<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    // Get all alerts
    public function index()
    {
        return Alert::orderBy('time', 'desc')->get();
    }

    // Save new alert
    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'type' => 'required|string',
            'time' => 'required|date',
        ]);

        $alert = Alert::create($request->all());
        return response()->json($alert);
    }

    // Delete alert
    public function destroy($id)
    {
        $alert = Alert::findOrFail($id);
        $alert->delete();
        return response()->json(['message' => 'Alert deleted']);
    }
}
