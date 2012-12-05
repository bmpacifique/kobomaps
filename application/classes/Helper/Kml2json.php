<?php defined('SYSPATH') or die('No direct access allowed.');
/***********************************************************
* Kml2json.php - Helper
* This software is copy righted by Kobo 2012
* Writen by John Etherton <john@ethertontech.com>, Etherton Technologies <http://ethertontech.com>
* Started on 2012-11-08
*************************************************************/

class Helper_Kml2json
{
	
	
	/**
	 * Takes the full path to a KML file creates a json file out of it
	 * and then returns the name of that json file
	 * @param string $file_path
	 */
	public static function convert($file_path, $template)
	{
		//blow away any template regions that exists for this template
		$regions = ORM::factory('Templateregion')
			->where('template_id', '=', $template->id)
			->find_all();
		foreach($regions as $r)
		{
			$r->delete();
		}
	
		// Where the file is going to be placed
		$target_paths = array();
	
		$directory = DOCROOT.'uploads/templates/';
		
		//Add the original filename to our target path.  Result is "uploads/filename.extension"
		$target_paths[0]  = $directory.$file_path;
	
		//get the name of the file, minus extention
		$info = pathinfo($file_path);
		$fileName =  basename($file_path,'.'.$info['extension']);
	
	
		//now we need to see if this is a KMZ file
		if(strtolower($info['extension']) == "kmz")
		{
			$zip = zip_open($target_paths[0]);
			if ($zip)
			{
				$newTarget = array();
				$i = 0;
				while ($zip_entry = zip_read($zip))
				{
					$newTarget[$i] = $directory.zip_entry_name($zip_entry);
					$fp = fopen($newTarget[$i], "w");
					if (zip_entry_open($zip, $zip_entry, "r"))
					{
						$buf = zip_entry_read($zip_entry, zip_entry_filesize($zip_entry));
						fwrite($fp,"$buf");
						zip_entry_close($zip_entry);
						fclose($fp);
					}
					$i++;
				}
				zip_close($zip);
				unlink($target_paths[0]);
				$target_paths = $newTarget;
			}
		}
	
			
	
	
	
	
	
	
		//buffer out echo statements
		ob_start();
		//start up the output json
		echo '{"areas":[';
	
		foreach($target_paths as $target_path)
		{
			self::parseXml($target_path, $template);
			unlink($target_path);
		}
		//close the "areas"
		echo "]}";
		
		$contents = ob_get_flush();
		$fp = fopen($directory.$fileName.".json", "w");
		fwrite($fp,$contents);
		fclose($fp);
		
		return $fileName.".json";
	}//end function convert
	
	
	public static function parseXml($kmlUrl, $template)
	{
		$xml = simplexml_load_file($kmlUrl);
	
		//go straight to the placemarks
		$placemarks = $xml->Document->Placemark;
		$areasCount = 0;
		//loop over each area
		foreach($placemarks as $placemark)
		{
			//create a template region 
			$region = ORM::factory('Templateregion');
			$region->title = $placemark->name[0];
			$region->template_id = $template->id;
			$region->save();
			
			$areasCount++;
			if($areasCount > 1)
			{
				echo ",";
			}
			self::parsePlacemark($placemark);
		}
	
	}
	
	
	/**
	 * Handles one specific area
	 */
	public static function parsePlacemark ($placemark)
	{
		$cumaltive_lat = 0;
		$cumaltive_lon = 0;
		$count = 0;
	
		//startup the area, it's name and points
		echo '{"area":"'.strval($placemark->name[0]).'","points":[';
	
	
	
		//loop over all the polygons in the MultiGeometry
		$polygons = $placemark->MultiGeometry->Polygon;
		//check if they're using MultiGeometry
		if($polygons == null)
		{
			$polygons = $placemark->Polygon;
		}
		$polygonCount = 0;
		foreach($polygons as $polygon)
		{
			//handle commas
			$polygonCount++;
			if($polygonCount > 1)
			{
				echo ",";
			}
	
			//an array of points for a polygon
			echo "[";
	
			//get the coordinates for each polygon
			$coordinatesStr = $polygon->outerBoundaryIs->LinearRing->coordinates[0];
			//split these up on spaces. What's left should read: longitude,latitude,altitude
			//$coordinateArray = explode (" ", $coordinatesStr);
			$coordinateArray =  preg_split('/\s+/', $coordinatesStr);
	
			$tripletsCount = 0;
			//now loop over these triplets
			$lastLat = -200;
			$lastLon = -200;
			foreach($coordinateArray as $cordTriplet)
			{
				$subArray = explode(",", $cordTriplet);
	
				if(count($subArray)< 2)
				{
					continue;
				}
	
	
					
				$lon = doubleval($subArray[0]);
				$lat = doubleval($subArray[1]);
				//$alt = floatval($subArray[2]);
					
					
					
					
				if($_POST['decimals'] != '-1')
				{
					$roundedLat = round($lat, intval($_POST['decimals'] ));
					$roundedLon = round($lon, intval($_POST['decimals'] ));
				}
				else
				{
					$roundedLat = $lat;
					$roundedLon = $lon;
				}
				//skip duplicate points
				if($lastLat == $roundedLat AND $lastLon == $roundedLon)
				{
					continue;
				}
					
				//hanlde commas
				$tripletsCount++;
				if($tripletsCount > 1)
				{
					echo ",";
				}
					
				$lastLat = $roundedLat;
				$lastLon = $roundedLon;
					
				$count++;
				$cumaltive_lon = $cumaltive_lon + $lon;
				$cumaltive_lat = $cumaltive_lat + $lat;
					
					
					
					
					
				echo "[$roundedLat,$roundedLon]";
			}
			echo "]";
				
		}
		echo "],";
		//calculate center point
		if($count > 0)
		{
			$marker_lat = $cumaltive_lat / $count;
			$marker_lon = $cumaltive_lon / $count;
			echo '"marker":['.$marker_lat.','.$marker_lon.']}';
		}
		else
		{
			echo '"marker":[0,0]}';
		}
	
	}//end function placePlacemark
}//end class
