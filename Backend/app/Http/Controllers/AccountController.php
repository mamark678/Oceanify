<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Account;

class AccountController extends Controller
{
    // SignUp
    public function createAccount(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:accounts,email',
            'password'   => 'required|min:6',
        ]);

        $account = new Account;
        $account->first_name = $request->first_name;
        $account->last_name  = $request->last_name;
        $account->email      = $request->email;
        $account->password   = $request->password; // plain text for demo only
        $account->save();

        return response()->json([
            'status' => 200,
            'msg' => 'Account created successfully!'
        ]);
    }

    // SignIn
    public function signIn(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $account = Account::where('email', $request->email)->first();

        if (!$account || $request->password !== $account->password) {
            return response()->json([
                'status' => 401,
                'msg' => 'Invalid credentials'
            ]);
        }

        return response()->json([
            'status' => 200,
            'msg' => 'Login successful',
            'user' => [
                'id' => $account->id,
                'first_name' => $account->first_name,
                'last_name' => $account->last_name,
                'email' => $account->email,
                'password' => $account->password // plain text for demo only
            ]
        ]);
    }

    // Get all accounts
    public function getAllAccounts()
    {
        $accounts = Account::all();

        return response()->json([
            'status' => 200,
            'allAccounts' => $accounts
        ]);
    }

    //Delete Account
    public function deleteAccount($id)
    {
        $account = Account::find($id);
        if (!$account) {
            return response()->json(['status' => 404, 'msg' => 'Account not found']);
        }
        $account->delete();
        return response()->json(['status' => 200, 'msg' => 'Account deleted successfully']);
    }

    // Get single account
    public function getAccount($id)
    {
        $account = Account::find($id);
        if (!$account) {
            return response()->json(['status' => 404, 'msg' => 'Account not found']);
        }

        return response()->json([
            'status' => 200,
            'account' => $account
        ]);
    }

    public function updateAccount(Request $request, $id)
    {
        $account = Account::find($id);
        if (!$account) {
            return response()->json(['status' => 404, 'msg' => 'Account not found']);
        }

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:accounts,email,' . $id,
            'password'   => 'nullable|min:6',
        ]);

        $account->first_name = $request->first_name;
        $account->last_name  = $request->last_name;
        $account->email      = $request->email;

       
        if ($request->password) {
            $account->password = $request->password; 
        }

        $account->save();

        return response()->json([
            'status' => 200,
            'msg' => 'Account updated successfully',
            'account' => $account
        ]);
    }
}
