<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::create('alerts', function (Blueprint $table) {
        $table->id();
        $table->text('message');  // alert text
        $table->string('type');   // 'custom' or 'auto'
        $table->dateTime('time'); // instead of $table->timestamp('time')
        $table->timestamps();     // created_at, updated_at
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
