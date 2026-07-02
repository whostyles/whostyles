<?php
require 'src/php/Whostyles.php';
use Whostyles\Whostyles;

$html1 = "This is some text \\{ws1:tPXGAKCm9fXwGhouAFXM3d3dzMzMGhou9fXwZqr.MzNEVVVm}";
$html2 = "This is some text {ws1:tPXGAKCm9fXwGhouAFXM3d3dzMzMGhou9fXwZqr.MzNEVVVm}";

echo "HTML1 extraction: " . (Whostyles::extract($html1) ?? 'null') . "\n";
echo "HTML2 extraction: " . (Whostyles::extract($html2) ?? 'null') . "\n";
echo "HTML1 clean: " . Whostyles::clean($html1) . "\n";
echo "HTML2 clean: " . Whostyles::clean($html2) . "\n";
