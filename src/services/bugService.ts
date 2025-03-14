import { supabase } from '@/lib/supabase';
import { Bug, BugWithRelationships } from '@/types/bug';

export async function createBug(
  bugData: Partial<Bug>,
  affectedItems: string[]
): Promise<Bug | null> {
  try {
    // Get the maximum position for ordering
    const { data: maxPosData } = await supabase
      .from('bugs')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);

    const newPosition = (maxPosData?.[0]?.position || 0) + 1000;

    // Insert the bug
    const { data: bug, error: bugError } = await supabase
      .from('bugs')
      .insert([{ ...bugData, position: newPosition }])
      .select()
      .single();

    if (bugError) throw bugError;

    return bug;
  } catch (error) {
    console.error('Error creating bug:', error);
    return null;
  }
}

export async function updateBug(
  bugId: string,
  bugData: Partial<Bug>,
  affectedItems?: string[]
): Promise<Bug | null> {
  try {
    // Update the bug
    const { data: bug, error: bugError } = await supabase
      .from('bugs')
      .update(bugData)
      .eq('id', bugId)
      .select()
      .single();

    if (bugError) throw bugError;

    return bug;
  } catch (error) {
    console.error('Error updating bug:', error);
    return null;
  }
}

export async function deleteBug(bugId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bugs')
      .delete()
      .eq('id', bugId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting bug:', error);
    return false;
  }
}

export async function getBugWithRelationships(bugId: string): Promise<BugWithRelationships | null> {
  try {
    // Get the bug
    const { data: bug, error: bugError } = await supabase
      .from('bugs')
      .select('*')
      .eq('id', bugId)
      .single();

    if (bugError) throw bugError;

    // Return bug without relationships
    return {
      ...bug,
      affected_items: [] // Empty array since we don't have relationships
    };
  } catch (error) {
    console.error('Error fetching bug with relationships:', error);
    return null;
  }
}

export async function getAllBugs(productId: string): Promise<BugWithRelationships[]> {
  try {
    const { data: bugs, error: bugError } = await supabase
      .from('bugs')
      .select('*')
      .eq('product_id', productId)
      .order('position');

    if (bugError) throw bugError;

    // Return bugs without trying to fetch relationships
    return bugs.map(bug => ({
      ...bug,
      affected_items: [] // Empty array since we don't have relationships
    }));
  } catch (error) {
    console.error('Error fetching all bugs:', error);
    return [];
  }
}

export async function updateBugPosition(
  bugId: string,
  newPosition: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bugs')
      .update({ position: newPosition })
      .eq('id', bugId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating bug position:', error);
    return false;
  }
}